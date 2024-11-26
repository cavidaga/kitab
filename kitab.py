import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import requests
from PIL import Image
import os
import time
import threading
import re
import webbrowser

BASE_URL = "http://web2.anl.az:81/read"
cancel_event = threading.Event()
dark_mode = False  

# Translations for GUI text
translations = {
    "en": {
        "title": "Book Downloader",
        "book_id": "Book ID:",
        "retry_limit": "Retry Limit:",
        "retry_delay": "Retry Delay (seconds):",
        "delete_images": "Delete images after creating PDF",
        "toggle_dark_mode": "Toggle Dark Mode",
        "start_download": "Start Download",
        "cancel_download": "Cancel Download",
        "language": "Language",
        "task_completed": "Task completed!",
        "error_occurred": "An error occurred: ",
        "pdf_saved": "PDF saved: ",
        "images_deleted": "Temporary images deleted.",
        "no_folder": "No folder selected. Operation cancelled.",
        "resolved_bibid": "Resolved numeric bibid: ",
        "failed_to_resolve": "Could not resolve bibid: ",
        "select_folder": "Select folder to save downloads",
        "copyright": "Made by Javid Agha",
        "disclaimer": "Not affiliated with Azerbaijan National Library",
    },
    "az": {
        "title": "Kitab Yükləyici",
        "book_id": "Kitabın ID nömrəsi:",
        "retry_limit": "Cəhd sayı:",
        "retry_delay": "Gecikmə (saniyə):",
        "delete_images": "PDF yaradıldıqdan sonra şəkilləri sil",
        "toggle_dark_mode": "Qaranlıq Rejimi",
        "start_download": "Yükləməyə Başla",
        "cancel_download": "Yükləməni Dayandır",
        "language": "Dil",
        "task_completed": "Tapşırıq tamamlandı!",
        "error_occurred": "Xəta baş verdi: ",
        "pdf_saved": "PDF olaraq saxlanıldı: ",
        "images_deleted": "Müvəqqəti şəkillər silindi.",
        "no_folder": "Qovluq seçilmədi. Əməliyyat ləğv edildi.",
        "resolved_bibid": "Numerik bibid həll edildi: ",
        "failed_to_resolve": "Bibid həll edilə bilmədi: ",
        "select_folder": "Yükləmələri saxlamaq üçün qovluğu seçin",
        "copyright": "Cavid Ağa tərəfindən hazırlanıb",
        "disclaimer": "Azərbaycan Milli Kitabxanası ilə əlaqəli deyil",
    },
}


def toggle_dark_mode():
    """Switch between light and dark mode."""
    global dark_mode
    dark_mode = not dark_mode
    style = {
        "dark": {"bg": "#2C2C2C", "fg": "#FFFFFF", "button_bg": "#555555", "entry_bg": "#3C3C3C", "progress": "#777777", "label_fg": "#FFFFFF"},
        "light": {"bg": "#F0F0F0", "fg": "#000000", "button_bg": "#E0E0E0", "entry_bg": "#FFFFFF", "progress": "#CCCCCC", "label_fg": "#000000"},
    }
    mode = "dark" if dark_mode else "light"
    root.configure(bg=style[mode]["bg"])

    for widget in root.winfo_children():
        if isinstance(widget, tk.Button):
            widget.configure(bg=style[mode]["button_bg"], activebackground=style[mode]["button_bg"])
        elif isinstance(widget, tk.Label):
            widget.configure(bg=style[mode]["bg"], fg=style[mode]["label_fg"])
        elif isinstance(widget, tk.Entry):
            widget.configure(bg=style[mode]["entry_bg"], fg=style[mode]["fg"])
        elif isinstance(widget, tk.Text):
            widget.configure(bg=style[mode]["entry_bg"], fg=style[mode]["fg"])

    progress_bar.configure(style=f"{mode}.Horizontal.TProgressbar")

    log_text.tag_configure("info", foreground=style[mode]["fg"])
    log_text.tag_configure("success", foreground="green")
    log_text.tag_configure("warning", foreground="orange")
    log_text.tag_configure("error", foreground="red")


def translate_gui():
    """Update GUI text based on the selected language."""
    lang = language_var.get()
    root.title(translations[lang]["title"])
    label_bibid.config(text=translations[lang]["book_id"])
    label_retry_limit.config(text=translations[lang]["retry_limit"])
    label_retry_delay.config(text=translations[lang]["retry_delay"])
    delete_images_checkbox.config(text=translations[lang]["delete_images"])
    dark_mode_button.config(text=translations[lang]["toggle_dark_mode"])
    start_button.config(text=translations[lang]["start_download"])
    cancel_button.config(text=translations[lang]["cancel_download"])
    language_label.config(text=translations[lang]["language"])
    copyright_label.config(text=translations[lang]["copyright"])
    disclaimer_label.config(text=translations[lang]["disclaimer"])


def create_pdf(output_dir, total_pages, bibid, delete_images):
    """Combine downloaded images into a PDF."""
    lang = language_var.get()
    pdf_file = os.path.join(output_dir, f"kitab_{bibid}.pdf")
    image_files = [os.path.join(output_dir, f"page_{i}.jpg") for i in range(1, total_pages + 1)]
    images = []

    for img_file in image_files:
        try:
            img = Image.open(img_file)
            if img.mode != "RGB":
                img = img.convert("RGB")
            images.append(img)
        except Exception as e:
            log_message(f"{translations[lang]['error_occurred']} {e}", "error")

    if images:
        images[0].save(pdf_file, save_all=True, append_images=images[1:])
        log_message(f"{translations[lang]['pdf_saved']} {pdf_file}", "success")

        if delete_images:
            for img_file in image_files:
                os.remove(img_file)
            log_message(translations[lang]["images_deleted"], "info")


def download_book(bibid, output_dir, retry_limit, retry_delay, delete_images):
    """Download the book and create a PDF."""
    lang = language_var.get()
    try:
        total_pages = 5  # Simulate total pages for testing
        create_pdf(output_dir, total_pages, bibid, delete_images)
        log_message(translations[lang]["task_completed"], "success")
    except Exception as e:
        log_message(f"{translations[lang]['error_occurred']} {e}", "error")


def start_download_thread():
    """Start the download in a separate thread."""
    lang = language_var.get()
    output_dir = filedialog.askdirectory(title=translations[lang]["select_folder"])
    if not output_dir:
        log_message(translations[lang]["no_folder"], "warning")
        return

    retry_limit = retry_limit_var.get()
    retry_delay = retry_delay_var.get()
    delete_images = delete_images_var.get()

    download_thread = threading.Thread(
        target=download_book,
        args=("12345", output_dir, retry_limit, retry_delay, delete_images),
        daemon=True
    )
    download_thread.start()


def log_message(message, level="info"):
    log_text.insert(tk.END, message + "\n", level)
    log_text.see(tk.END)
def open_link(event):
    webbrowser.open("https://cavid.info")

# UI Setup
root = tk.Tk()
root.geometry("400x650")
root.title("Book Downloader")
root.resizable(False, False)

language_var = tk.StringVar(master=root, value="en")

# Styling
style = ttk.Style()
style.configure("light.Horizontal.TProgressbar", troughcolor="#CCCCCC", background="#4CAF50")
style.configure("dark.Horizontal.TProgressbar", troughcolor="#777777", background="#00FF00")

frame = tk.Frame(root)
frame.pack(pady=10)

# Language Selection
language_label = tk.Label(frame, text="Language")
language_label.grid(row=0, column=0, padx=5, pady=5)

language_dropdown = ttk.Combobox(frame, textvariable=language_var, values=["en", "az"], state="readonly", width=10)
language_dropdown.grid(row=0, column=1, padx=5, pady=5)
language_dropdown.bind("<<ComboboxSelected>>", lambda e: translate_gui())

# Labels and Inputs
label_bibid = tk.Label(frame, text=translations["en"]["book_id"])
label_bibid.grid(row=1, column=0, padx=5, pady=5)

bibid_entry = tk.Entry(frame, width=30)
bibid_entry.grid(row=1, column=1, padx=5, pady=5)

label_retry_limit = tk.Label(frame, text=translations["en"]["retry_limit"])
label_retry_limit.grid(row=2, column=0, padx=5, pady=5)

retry_limit_var = tk.IntVar(value=3)
retry_limit_entry = tk.Entry(frame, textvariable=retry_limit_var)
retry_limit_entry.grid(row=2, column=1, padx=5, pady=5)

label_retry_delay = tk.Label(frame, text=translations["en"]["retry_delay"])
label_retry_delay.grid(row=3, column=0, padx=5, pady=5)

retry_delay_var = tk.DoubleVar(value=1.0)
retry_delay_entry = tk.Entry(frame, textvariable=retry_delay_var)
retry_delay_entry.grid(row=3, column=1, padx=5, pady=5)

delete_images_var = tk.BooleanVar(value=False)
delete_images_checkbox = tk.Checkbutton(root, text=translations["en"]["delete_images"], variable=delete_images_var)
delete_images_checkbox.pack()

dark_mode_button = tk.Button(root, text=translations["en"]["toggle_dark_mode"], command=toggle_dark_mode)
dark_mode_button.pack(pady=5)

start_button = tk.Button(root, text=translations["en"]["start_download"], command=start_download_thread)
start_button.pack(pady=5)

cancel_button = tk.Button(root, text=translations["en"]["cancel_download"])
cancel_button.pack(pady=5)

log_text = tk.Text(root, height=15, width=50, wrap="word")
log_text.pack(padx=10, pady=10)

progress_bar = ttk.Progressbar(root, orient="horizontal", length=300, mode="determinate")
progress_bar.pack(pady=10)

copyright_label = tk.Label(
    root,
    text=translations["en"]["copyright"],
    fg="blue",
    cursor="hand2"
)
copyright_label.pack(pady=(10, 0))
copyright_label.bind("<Button-1>", open_link)

disclaimer_label = tk.Label(
    root,
    text=translations["en"]["disclaimer"],
    fg="gray"
)
disclaimer_label.pack(pady=(0, 10))

translate_gui()  # Initialize with default language
root.mainloop()
