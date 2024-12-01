import os
import sys
import time
import requests
from PIL import Image, ImageTk
from tkinter import Toplevel, Label, Button, filedialog, messagebox
import threading
import re
from concurrent.futures import ThreadPoolExecutor
import tkinter as tk
from tkinter import ttk
import fitz

# Define supported languages and translations
LANGUAGES = {
    "English": {
        "select_language": "Select Language",
        "book_id": "Book ID:",
        "start_page": "Start Page:",
        "end_page": "End Page:",
        "delete_images": "Delete Images After PDF Creation",
        "start_download": "Start Download",
        "cancel_download": "Cancel Download",
        "queue_section": "Queue Section",
        "add_to_queue": "Add to Queue",
        "remove_selected": "Remove Selected",
        "start_queue": "Start Queue",
        "log_section": "Log Section",
        "log_panel": "Hide Logs",
        "view_error_log": "View Error Log",
        "clear_error_log": "Clear Error Log",
        "toggle_dark_mode": "Toggle Dark Mode"
    },
    "Azərbaycan": {
        "select_language": "Dil Seçimi",
        "book_id": "Kitabın ID nömrəsi:",
        "start_page": "Başlanğıc Səhifəsi:",
        "end_page": "Son Səhifəsi:",
        "delete_images": "PDF yaradıldıqdan sonra şəkilləri sil",
        "start_download": "Yükləməyə Başla",
        "cancel_download": "Yükləməni Dayandır",
        "queue_section": "Sıra Bölməsi",
        "add_to_queue": "Sıraya Əlavə Et",
        "remove_selected": "Seçilmişi Sil",
        "start_queue": "Sıranı Başlat",
        "log_section": "Jurnal Bölməsi",
        "log_panel": "Jurnalı Gizlət",
        "view_error_log": "Xəta Jurnalına Bax",
        "clear_error_log": "Xəta Jurnalını Təmizlə",
        "toggle_dark_mode": "Qaranlıq Rejimi Dəyişdir"
    }
}


current_language = "English"  # Default language

BASE_URL = "http://web2.anl.az:81/read"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Referer": BASE_URL,
}
DELAY = 2  # Seconds to wait after preload
MIN_IMAGE_SIZE = 1024  # Minimum valid image size in bytes
ERROR_LOG_FILE = "error_log.txt"
log_lock = threading.Lock()  # Ensure thread safety when writing to the log
def resource_path(relative_path):
    """Get absolute path to resource, works for PyInstaller bundling."""
    try:
        base_path = sys._MEIPASS  # Temporary folder for PyInstaller executables
    except AttributeError:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)
cancel_flag = False
total_pages = 0
pages_downloaded = 0
pages_failed = 0
start_time = None
queue = []  # To store the list of book IDs
current_book = None
dark_mode = False  # Dark mode toggle

class ToolTip:
    """Class to add a tooltip to a widget."""
    def __init__(self, widget, text=""):
        self.widget = widget
        self.text = text
        self.tooltip_window = None
        widget.bind("<Enter>", self.show_tooltip)
        widget.bind("<Leave>", self.hide_tooltip)

    def show_tooltip(self, event=None):
        if self.tooltip_window:
            return
        x, y, cx, cy = self.widget.bbox("insert")
        x += self.widget.winfo_rootx() + 25
        y += self.widget.winfo_rooty() + 25
        self.tooltip_window = tw = tk.Toplevel(self.widget)
        tw.wm_overrideredirect(True)
        tw.wm_geometry(f"+{x}+{y}")
        label = tk.Label(
            tw,
            text=self.text,
            justify="left",
            background="yellow",
            relief="solid",
            borderwidth=1,
            font=("tahoma", "8", "normal")
        )
        label.pack(ipadx=1)

    def hide_tooltip(self, event=None):
        if self.tooltip_window:
            self.tooltip_window.destroy()
            self.tooltip_window = None
def normalize_bibid(bibid):
    """
    Normalize the book ID to extract the numeric part.
    Accepts plain numeric IDs or IDs with 'vtls' prefix (e.g., vtls000000004).
    """
    # Check if it starts with 'vtls' and extract the numeric part
    if bibid.startswith("vtls"):
        numeric_part = ''.join(filter(str.isdigit, bibid))
        if numeric_part:
            return numeric_part.lstrip("0")  # Remove leading zeros
    elif bibid.isdigit():
        return bibid.lstrip("0")  # Remove leading zeros for plain numeric IDs
    
    raise ValueError("Invalid Book ID format. Must be numeric or start with 'vtls'.")

def get_total_pages(bibid):
    """Get the total number of pages from the website."""
    page_url = f"{BASE_URL}/page.php?bibid={bibid}&pno=1"
    response = requests.get(page_url, headers=HEADERS)
    response.raise_for_status()
    match = re.search(r'last_page_params="\?bibid=\d+&pno=(\d+)"', response.text)
    if match:
        return int(match.group(1))
    raise ValueError("Failed to fetch the total number of pages.")


def download_page(session, bibid, page_no, output_file):
    """Download a single page."""
    preload_url = f"{BASE_URL}/page.php?bibid={bibid}&pno={page_no}"
    image_url = f"{BASE_URL}/img.php?bibid={bibid}&pno={page_no}"

    try:
        # Preload the page
        session.get(preload_url, headers=HEADERS, timeout=10).raise_for_status()
        time.sleep(DELAY)  # Wait to mimic human browsing

        # Download the image
        response = session.get(image_url, headers=HEADERS, stream=True, timeout=10)
        response.raise_for_status()

        # Save the image to file
        with open(output_file, "wb") as f:
            f.write(response.content)

        # Validate file size
        if os.path.getsize(output_file) < MIN_IMAGE_SIZE:
            raise ValueError("File size too small. The image may be invalid.")

        return True
    except Exception as e:
        log_message(f"Failed to download page {page_no}: {e}", "error")
        return False

def download_book(bibid, output_dir, retry_limit, retry_delay, delete_images, start_page=1, end_page=None):
    """Download the book with page range support."""
    global cancel_flag, total_pages, pages_downloaded, pages_failed, start_time
    start_time = time.time()  # Start the timer
    pages_downloaded = 0
    pages_failed = 0

    # Create a unique subdirectory for the book
    book_dir = os.path.join(output_dir, f"book_{bibid}")
    os.makedirs(book_dir, exist_ok=True)

    total_pages = get_total_pages(bibid)

    # Validate page range
    if end_page is None or end_page > total_pages:
        end_page = total_pages

    if start_page < 1 or start_page > total_pages:
        log_message(f"Invalid start page: {start_page}. Setting to 1.", "warning")
        start_page = 1

    if end_page < start_page:
        log_message("End page cannot be less than start page. Adjusting to start page.", "warning")
        end_page = start_page

    log_message(f"Downloading pages {start_page} to {end_page} of {total_pages} for book ID: {bibid}.", "info")
    progress_bar["maximum"] = end_page - start_page + 1

    with requests.Session() as session:
        session.headers.update(HEADERS)
        for page_no in range(start_page, end_page + 1):
            if cancel_flag:
                log_message("Download cancelled.", "warning")
                return False  # Indicate download was incomplete

            output_file = os.path.join(book_dir, f"page_{page_no}.jpg")
            if os.path.exists(output_file) and os.path.getsize(output_file) >= MIN_IMAGE_SIZE:
                log_message(f"Page {page_no} already exists. Skipping...", "info")
                pages_downloaded += 1
                update_progress(page_no - start_page + 1)
                continue

            if download_page(session, bibid, page_no, output_file):
                pages_downloaded += 1
                log_message(f"Page {page_no} downloaded successfully.", "success")
            else:
                pages_failed += 1
                log_message(f"Page {page_no}: Failed to download.", "error")

            update_progress(page_no - start_page + 1)
    log_message("Combining images into a PDF...", "info")
    create_pdf(book_dir, bibid, start_page, end_page)
    log_message("Download completed!", "success")
    return True


def start_queue_thread():
    """Start queue processing in a separate thread."""
    global cancel_flag
    cancel_flag = False
    threading.Thread(target=process_queue, daemon=True).start()

def process_queue():
    """Process the queue of book downloads."""
    global cancel_flag
    while queue:
        if cancel_flag:
            log_message("Queue processing cancelled.", "warning")
            return

        raw_bibid = queue.pop(0)
        update_queue_display()

        try:
            # Normalize the bibid
            bibid = normalize_bibid(raw_bibid)
        except ValueError as e:
            log_message(f"Skipping invalid Book ID in queue: {raw_bibid}. Error: {e}", "error")
            continue

        output_dir = filedialog.askdirectory(title="Select folder to save downloads")
        if not output_dir:
            log_message(f"No folder selected for Book ID: {bibid}. Skipping.", "warning")
            continue

        log_message(f"Starting download for Book ID: {bibid}.", "info")
        success = download_book(
            bibid, output_dir, retry_limit_var.get(), retry_delay_var.get(),
            delete_images_var.get(), start_page_var.get(), end_page_var.get()
        )
        if success:
            log_message(f"Completed download for Book ID: {bibid}.", "success")
        else:
            log_message(f"Failed to complete download for Book ID: {bibid}.", "error")
    log_message("Queue processing complete.", "success")

def create_pdf(book_dir, bibid, start_page, end_page):
    """Create a PDF from the downloaded images."""
    pdf_path = os.path.join(book_dir, f"book_{bibid}.pdf")
    image_files = [
        os.path.join(book_dir, f"page_{i}.jpg")
        for i in range(start_page, end_page + 1)
    ]
    images = []

    for img_file in image_files:
        try:
            img = Image.open(img_file)
            if img.mode != "RGB":
                img = img.convert("RGB")
            images.append(img)
        except FileNotFoundError:
            log_message(f"Skipping missing image {img_file}", "warning")
        except Exception as e:
            log_message(f"Skipping invalid image {img_file}: {e}", "warning")

    if images:
        images[0].save(pdf_path, save_all=True, append_images=images[1:])
        log_message(f"PDF saved: {pdf_path}", "success")
        # Cleanup after successful PDF creation
        if delete_images_var.get():
            for img_file in image_files:
                try:
                    os.remove(img_file)
                    log_message(f"Deleted {img_file}", "info")
                except Exception as e:
                    log_message(f"Failed to delete {img_file}: {e}", "error")
    else:
        log_message("No valid images to create a PDF.", "error")

def toggle_dark_mode():
    """Switch between light and dark modes."""
    global dark_mode
    dark_mode = not dark_mode
    style = {"dark": {"bg": "#2C2C2C", "fg": "#FFFFFF"},
             "light": {"bg": "#F0F0F0", "fg": "#000000"}}
    mode = "dark" if dark_mode else "light"
    root.configure(bg=style[mode]["bg"])
    # Update widgets for dark mode
    for widget in root.winfo_children():
        if isinstance(widget, tk.Label) or isinstance(widget, tk.Button):
            widget.configure(bg=style[mode]["bg"], fg=style[mode]["fg"])

def log_message(message, level="info"):
    """Log messages to the UI with colour coding."""
    log_text.insert(tk.END, message + "\\n", level)
    if level == "error":
        log_text.tag_configure("error", foreground="red")
    elif level == "warning":
        log_text.tag_configure("warning", foreground="orange")
    elif level == "success":
        log_text.tag_configure("success", foreground="green")
    log_text.see(tk.END)

# Collapsible log functionality
def toggle_log_panel():
    if log_text.winfo_viewable():
        log_text.grid_remove()
        toggle_log_button.configure(text="Show Logs")
    else:
        log_text.grid()
        toggle_log_button.configure(text="Hide Logs")
def add_tooltip(widget, text):
    ToolTip(widget, text=text)

def start_download_thread():
    """Start the download process in a separate thread."""
    global cancel_flag
    cancel_flag = False
    bibid_raw = bibid_entry.get().strip()
    
    try:
        # Normalize the bibid to extract the numeric part
        bibid = normalize_bibid(bibid_raw)
    except ValueError as e:
        log_message(str(e), "error")
        return

    output_dir = filedialog.askdirectory(title="Select folder to save downloads")
    if not output_dir:
        log_message("No folder selected. Operation cancelled.", "warning")
        return

    start_page = start_page_var.get()
    end_page = end_page_var.get()

    threading.Thread(
        target=download_book,
        args=(
            bibid,
            output_dir,
            retry_limit,  # Use casted variable
            retry_delay,
            delete_images_var.get(),
            start_page,
            end_page,
        ),
        daemon=True
    ).start()

def cancel_download():
    """Cancel the ongoing download."""
    global cancel_flag
    cancel_flag = True
    log_message("Download cancelled by the user.", "warning")


def update_progress(current_page):
    """Update the progress bar, progress text, and statistics."""
    progress_bar["value"] = current_page
    progress_percentage = (current_page / total_pages) * 100 if total_pages > 0 else 0
    elapsed_time = time.time() - start_time
    avg_time_per_page = elapsed_time / current_page if current_page > 0 else 0
    estimated_time_remaining = (total_pages - current_page) * avg_time_per_page

    stats_text = (
        f"Downloaded: {pages_downloaded}/{total_pages}\n"
        f"Failed: {pages_failed}\n"
        f"Elapsed Time: {elapsed_time:.2f}s\n"
        f"Estimated Time Remaining: {estimated_time_remaining:.2f}s"
    ) if total_pages > 0 else "No progress yet."

    stats_label.config(text=stats_text)

    # Update progress color based on percentage
    if progress_percentage < 50:
        progress_bar_style.configure("Horizontal.TProgressbar", background="red")
    elif 50 <= progress_percentage < 80:
        progress_bar_style.configure("Horizontal.TProgressbar", background="orange")
    else:
        progress_bar_style.configure("Horizontal.TProgressbar", background="green")

    root.update_idletasks()

def add_to_queue():
    """Add the current book ID to the queue."""
    raw_bibid = bibid_entry.get().strip()
    try:
        # Normalize the bibid
        bibid = normalize_bibid(raw_bibid)
        queue.append(bibid)
        update_queue_display()
    except ValueError as e:
        log_message(f"Invalid Book ID: {raw_bibid}. Error: {e}", "error")

def remove_from_queue():
    """Remove the selected book ID from the queue."""
    selected = queue_display.curselection()
    if selected:
        queue.pop(selected[0])
        update_queue_display()

def update_queue_display():
    """Update the Listbox to show the current queue."""
    queue_display.delete(0, tk.END)
    for item in queue:
        queue_display.insert(tk.END, item)

def open_viewer(output_dir, bibid, start_page, end_page):
    """Open the built-in viewer for the downloaded book."""
    if not os.path.exists(output_dir):
        messagebox.showerror("Error", "The output directory does not exist.")
        return

    # Create a list of image paths for the given range
    image_files = [
        os.path.join(output_dir, f"page_{i}.jpg") for i in range(start_page, end_page + 1)
    ]
    image_files = [f for f in image_files if os.path.exists(f)]

    if not image_files:
        messagebox.showerror("Error", "No images found for the specified book and page range.")
        return

    # Create a new window for the viewer
    viewer_window = Toplevel()
    viewer_window.title(f"Viewer - Book {bibid}")
    viewer_window.geometry("600x800")

    # Variables to track the current image index
    current_image_idx = tk.IntVar(value=0)

    def update_image():
        """Update the displayed image."""
        try:
            img_path = image_files[current_image_idx.get()]
            img = Image.open(img_path)
            img.thumbnail((600, 750))  # Resize to fit the window
            img_tk = ImageTk.PhotoImage(img)

            image_label.config(image=img_tk)
            image_label.image = img_tk
            page_label.config(text=f"Page {start_page + current_image_idx.get()}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load image: {e}")

    def next_image():
        """Display the next image."""
        if current_image_idx.get() < len(image_files) - 1:
            current_image_idx.set(current_image_idx.get() + 1)
            update_image()

    def prev_image():
        """Display the previous image."""
        if current_image_idx.get() > 0:
            current_image_idx.set(current_image_idx.get() - 1)
            update_image()

    image_label = Label(viewer_window, text="Loading image...", bg="gray")
    image_label.pack(expand=True, fill=tk.BOTH)

    page_label = Label(viewer_window, text="", font=("Arial", 12))
    page_label.pack(pady=5)

    navigation_frame = tk.Frame(viewer_window)
    navigation_frame.pack(pady=10)

    prev_button = Button(navigation_frame, text="Previous", command=prev_image)
    prev_button.grid(row=0, column=0, padx=5)

    next_button = Button(navigation_frame, text="Next", command=next_image)
    next_button.grid(row=0, column=1, padx=5)

    # Load the first image
    update_image()
    
def add_viewer_button_to_gui(root, output_dir, bibid_entry, start_page_var, end_page_var):
    """Attach the viewer button to the GUI."""
    def open_viewer_callback():
        bibid = bibid_entry.get().strip()
        start_page = start_page_var.get()
        end_page = end_page_var.get()

        if not bibid:
            messagebox.showerror("Error", "Please enter a valid Book ID.")
            return

        if start_page <= 0 or end_page <= 0 or start_page > end_page:
            messagebox.showerror("Error", "Invalid page range.")
            return

        open_viewer(output_dir, bibid, start_page, end_page)

    viewer_button = Button(root, text="View Downloaded Pages", command=open_viewer_callback)
    viewer_button.pack(pady=5)

add_viewer_button_to_gui_code = True  # Signal that the viewer button function is ready.

def write_to_error_log(message):
    """Write an error message to the log file."""
    with log_lock:
        with open(ERROR_LOG_FILE, "a", encoding="utf-8") as log_file:
            log_file.write(message + "\n")

def log_message(message, level="info"):
    """Log messages to the UI and the error log if it's an error."""
    log_text.insert(tk.END, message + "\n", level)
    log_text.see(tk.END)
    if level == "error":
        write_to_error_log(message)

def view_error_log():
    """View the contents of the error log in a popup window."""
    try:
        with open(ERROR_LOG_FILE, "r", encoding="utf-8") as log_file:
            log_content = log_file.read()
    except FileNotFoundError:
        log_content = "No error log file found."

    # Create a new popup window to display the log
    log_window = tk.Toplevel(root)
    log_window.title("Error Log")
    log_window.geometry("600x400")

    log_text_widget = tk.Text(log_window, wrap="word", height=20, width=70)
    log_text_widget.insert("1.0", log_content)
    log_text_widget.configure(state="disabled")  # Make the text read-only
    log_text_widget.pack(padx=10, pady=10)

    close_button = tk.Button(log_window, text="Close", command=log_window.destroy)
    close_button.pack(pady=5)


def clear_error_log():
    """Clear the error log file after confirmation."""
    if messagebox.askyesno("Confirm Clear", "Are you sure you want to clear the error log?"):
        with log_lock:
            with open(ERROR_LOG_FILE, "w", encoding="utf-8") as log_file:
                log_file.write("")  # Clear the file
        log_message("Error log cleared.", "info")
        
# Update GUI texts dynamically based on the selected language
def update_language():
    book_id_label.config(text=LANGUAGES[current_language]["book_id"])
    start_page_label.config(text=LANGUAGES[current_language]["start_page"])
    end_page_label.config(text=LANGUAGES[current_language]["end_page"])
    start_button.config(text=LANGUAGES[current_language]["start_download"])
    cancel_button.config(text=LANGUAGES[current_language]["cancel_download"])
    add_button.config(text=LANGUAGES[current_language]["add_to_queue"])
    remove_button.config(text=LANGUAGES[current_language]["remove_selected"])
    start_queue_button.config(text=LANGUAGES[current_language]["start_queue"])
    delete_images_checkbox.config(text=LANGUAGES[current_language]["delete_images"])
    toggle_log_button.config(text=LANGUAGES[current_language]["log_panel"])
    view_log_button.config(text=LANGUAGES[current_language]["view_error_log"])
    clear_log_button.config(text=LANGUAGES[current_language]["clear_error_log"])
    dark_mode_button.config(text=LANGUAGES[current_language]["toggle_dark_mode"])
    language_label.config(text=LANGUAGES[current_language]["select_language"])

# Language switching function
def switch_language(event=None):
    global current_language
    current_language = language_var.get()
    update_language()

# GUI Setup
root = tk.Tk()
root.title("AMK Downloader")
root.geometry("700x800")

# Retry and delay variables
retry_limit_var = tk.IntVar(value=3)
retry_delay_var = tk.DoubleVar(value=1.0)
retry_limit = int(retry_limit_var.get())  # Ensure it's treated as an integer
retry_delay = float(retry_delay_var.get())  # Ensure it's treated as a float
# Icon for the window
icon_path = resource_path("icon.ico")
root.iconbitmap(icon_path)

# Language selection dropdown
language_var = tk.StringVar(value="English")
language_label = tk.Label(root, text=LANGUAGES[current_language]["select_language"])
language_label.pack(pady=5)
language_dropdown = ttk.Combobox(root, textvariable=language_var, state="readonly", width=10)
language_dropdown['values'] = ("English", "Azərbaycan")
language_dropdown.pack(pady=5)
language_dropdown.bind("<<ComboboxSelected>>", switch_language)

# Input fields: Book ID, Start Page, End Page in one row
input_frame = tk.Frame(root)
input_frame.pack(pady=10)

book_id_label = tk.Label(input_frame, text=LANGUAGES[current_language]["book_id"])
book_id_label.grid(row=0, column=0, padx=5, pady=5, sticky="w")
bibid_entry = tk.Entry(input_frame, width=20)
bibid_entry.grid(row=0, column=1, padx=5, pady=5)

start_page_label = tk.Label(input_frame, text=LANGUAGES[current_language]["start_page"])
start_page_label.grid(row=0, column=2, padx=5, pady=5, sticky="w")
start_page_var = tk.IntVar(value=1)
start_page_entry = tk.Entry(input_frame, textvariable=start_page_var, width=10)
start_page_entry.grid(row=0, column=3, padx=5, pady=5)

end_page_label = tk.Label(input_frame, text=LANGUAGES[current_language]["end_page"])
end_page_label.grid(row=0, column=4, padx=5, pady=5, sticky="w")
end_page_var = tk.IntVar(value=0)
end_page_entry = tk.Entry(input_frame, textvariable=end_page_var, width=10)
end_page_entry.grid(row=0, column=5, padx=5, pady=5)

# Delete Images Checkbox
delete_images_var = tk.BooleanVar(value=False)
delete_images_checkbox = tk.Checkbutton(root, text=LANGUAGES[current_language]["delete_images"], variable=delete_images_var)
delete_images_checkbox.pack(pady=5)

# Buttons for Start and Cancel Download
icon_frame = tk.Frame(root)
icon_frame.pack(pady=10)

start_icon_path = resource_path("start_icon.png")
cancel_icon_path = resource_path("cancel_icon.png")

start_button_icon = tk.PhotoImage(file=start_icon_path)
cancel_button_icon = tk.PhotoImage(file=cancel_icon_path)

start_button = tk.Button(icon_frame, image=start_button_icon, command=start_download_thread)
start_button.pack(side="left", padx=10)

cancel_button = tk.Button(icon_frame, image=cancel_button_icon, command=cancel_download)
cancel_button.pack(side="right", padx=10)
cancel_button.config(state="disabled")

# Progress Bar
progress_bar = ttk.Progressbar(root, orient="horizontal", length=600, mode="determinate", style="Horizontal.TProgressbar")
progress_bar.pack(pady=10)

progress_bar_style = ttk.Style()
progress_bar_style.theme_use("clam")
progress_bar_style.configure(
    "Horizontal.TProgressbar",
    troughcolor="gray",
    bordercolor="black",
    background="green",
    lightcolor="lime",
    darkcolor="green",
)

stats_label = tk.Label(root, text="", justify="left", anchor="w", font=("Arial", 10))
stats_label.pack(pady=5)

# Queue-related controls in a dedicated section
queue_frame = tk.LabelFrame(root, text=LANGUAGES[current_language]["queue_section"], padx=10, pady=10)
queue_frame.pack(pady=10)

queue_display = tk.Listbox(queue_frame, height=5, width=60)
queue_display.pack(pady=5)

add_button = tk.Button(queue_frame, text=LANGUAGES[current_language]["add_to_queue"], command=add_to_queue)
add_button.pack(side="left", padx=5)

remove_button = tk.Button(queue_frame, text=LANGUAGES[current_language]["remove_selected"], command=remove_from_queue)
remove_button.pack(side="left", padx=5)

start_queue_button = tk.Button(queue_frame, text=LANGUAGES[current_language]["start_queue"], command=start_queue_thread)
start_queue_button.pack(side="left", padx=5)

# Log Panel with collapsibility
log_frame = tk.LabelFrame(root, text=LANGUAGES[current_language]["log_section"], padx=10, pady=10)
log_frame.pack(pady=10)

log_text = tk.Text(log_frame, height=10, width=80, wrap="word")
log_text.pack(padx=5, pady=5)

toggle_log_button = tk.Button(log_frame, text=LANGUAGES[current_language]["log_panel"], command=toggle_log_panel)
toggle_log_button.pack(pady=5)

log_button_frame = tk.Frame(log_frame)
log_button_frame.pack(pady=5)

view_log_button = tk.Button(log_button_frame, text=LANGUAGES[current_language]["view_error_log"], command=view_error_log)
view_log_button.pack(side="left", padx=5)

clear_log_button = tk.Button(log_button_frame, text=LANGUAGES[current_language]["clear_error_log"], command=clear_error_log)
clear_log_button.pack(side="right", padx=5)

# Dark Mode Toggle
dark_mode_button = tk.Button(root, text=LANGUAGES[current_language]["toggle_dark_mode"], command=toggle_dark_mode)
dark_mode_button.pack(pady=10)

# Initialize GUI with default language
update_language()

# Finalize and Run
root.mainloop()