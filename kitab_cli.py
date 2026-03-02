#!/usr/bin/env python3
import os
import sys
import time
import requests
from PIL import Image
try:
    import fitz
except ImportError:
    pass
import re
import argparse

BASE_URL = "http://web2.anl.az:81/read"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Referer": BASE_URL,
}
DELAY = 2
MIN_IMAGE_SIZE = 1024

def normalize_bibid(bibid):
    if bibid.startswith("vtls"):
        numeric_part = ''.join(filter(str.isdigit, bibid))
        if numeric_part:
            return numeric_part.lstrip("0")
    elif bibid.isdigit():
        return bibid.lstrip("0")
    raise ValueError("Invalid Book ID format. Must be numeric or start with 'vtls'.")

def get_total_pages(bibid):
    page_url = f"{BASE_URL}/page.php?bibid={bibid}&pno=1"
    response = requests.get(page_url, headers=HEADERS)
    response.raise_for_status()
    match = re.search(r'last_page_params="\?bibid=\d+&pno=(\d+)"', response.text)
    if match:
        return int(match.group(1))
    raise ValueError("Failed to fetch the total number of pages.")

def download_page(session, bibid, page_no, output_file):
    preload_url = f"{BASE_URL}/page.php?bibid={bibid}&pno={page_no}"
    image_url = f"{BASE_URL}/img.php?bibid={bibid}&pno={page_no}"
    try:
        session.get(preload_url, headers=HEADERS, timeout=10).raise_for_status()
        time.sleep(DELAY)
        response = session.get(image_url, headers=HEADERS, stream=True, timeout=10)
        response.raise_for_status()
        with open(output_file, "wb") as f:
            f.write(response.content)
        if os.path.getsize(output_file) < MIN_IMAGE_SIZE:
            raise ValueError("File size too small. The image may be invalid.")
        return True
    except Exception as e:
        print(f"Failed to download page {page_no}: {e}", file=sys.stderr)
        return False

def fetch_metadata(bibid):
    url = f"https://ek.anl.az/lib/item?id=chamo:{bibid}&theme=e-kataloq"
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            html = response.text
            metadata = {}
            title_match = re.search(r'<h1 class="title">(.*?)</h1>', html, re.DOTALL | re.IGNORECASE)
            if title_match:
                metadata['title'] = re.sub(r'<[^>]+>', '', title_match.group(1)).strip()
            author_match = re.search(r'class="author">(.*?)</a>', html, re.DOTALL | re.IGNORECASE)
            if author_match:
                metadata['author'] = re.sub(r'<[^>]+>', '', author_match.group(1)).strip()
            date_match = re.search(r'\$c\s+(\d{4})\s*</div>', html)
            if date_match:
                metadata['creationDate'] = date_match.group(1).strip()
            return metadata
    except Exception as e:
        print(f"Warning: Metadata fetch failed: {e}", file=sys.stderr)
    return {}

def create_pdf(book_dir, bibid, start_page, end_page, delete_images):
    pdf_path = os.path.join(book_dir, f"book_{bibid}.pdf")
    image_files = [
        os.path.join(book_dir, f"page_{i}.jpg")
        for i in range(start_page, end_page + 1)
    ]
    images = []

    for img_file in image_files:
        if not os.path.exists(img_file):
            continue
        try:
            img = Image.open(img_file)
            if img.mode != "RGB":
                img = img.convert("RGB")
            images.append(img)
        except Exception as e:
            print(f"Skipping image {img_file}: {e}", file=sys.stderr)

    if images:
        images[0].save(pdf_path, save_all=True, append_images=images[1:])
        print(f"PDF saved successfully: {pdf_path}")
        
        meta = fetch_metadata(bibid)
        if meta and 'fitz' in sys.modules:
            try:
                doc = fitz.open(pdf_path)
                doc.set_metadata(meta)
                doc.saveIncr()
                doc.close()
                print(f"Applied metadata to PDF: Title: {meta.get('title', 'Unknown')}")
            except Exception as e:
                print(f"Failed to apply metadata: {e}", file=sys.stderr)

        if delete_images:
            for img_file in image_files:
                try:
                    if os.path.exists(img_file):
                        os.remove(img_file)
                except Exception as e:
                    print(f"Failed to delete {img_file}: {e}", file=sys.stderr)
    else:
        print("No valid images to create a PDF.", file=sys.stderr)

def download_book(bibid, output_dir, delete_images, start_page=1, end_page=None):
    book_dir = os.path.join(output_dir, f"book_{bibid}")
    os.makedirs(book_dir, exist_ok=True)

    print(f"Fetching info for book ID: {bibid}...")
    try:
        total_pages = get_total_pages(bibid)
    except Exception as e:
        print(f"Error fetching total pages: {e}", file=sys.stderr)
        return False

    if end_page is None or end_page > total_pages:
        end_page = total_pages
    if start_page < 1 or start_page > total_pages:
        start_page = 1
    if end_page < start_page:
        end_page = start_page

    print(f"Downloading pages {start_page} to {end_page} of {total_pages} for book ID: {bibid}.")
    
    pages_downloaded = 0
    pages_failed = 0

    with requests.Session() as session:
        session.headers.update(HEADERS)
        for page_no in range(start_page, end_page + 1):
            output_file = os.path.join(book_dir, f"page_{page_no}.jpg")
            if os.path.exists(output_file) and os.path.getsize(output_file) >= MIN_IMAGE_SIZE:
                print(f"Page {page_no} already exists. Skipping...")
                pages_downloaded += 1
                continue

            print(f"Downloading page {page_no}...", end="", flush=True)
            if download_page(session, bibid, page_no, output_file):
                pages_downloaded += 1
                print(" Done.")
            else:
                pages_failed += 1
                print(" Failed.")

    print("\nCombining images into a PDF...")
    create_pdf(book_dir, bibid, start_page, end_page, delete_images)
    print("Download sequence completed!")
    return True

def main():
    parser = argparse.ArgumentParser(description="AMK Downloader (Kitab) - Headless Terminal CLI")
    parser.add_argument("bibid", help="Book ID (e.g., vtls000000004 or 4)")
    parser.add_argument("-o", "--output", default=".", help="Output directory to save downloads (default: current directory)")
    parser.add_argument("-s", "--start", type=int, default=1, help="Start page (default: 1)")
    parser.add_argument("-e", "--end", type=int, default=None, help="End page (default: total pages)")
    parser.add_argument("-d", "--delete", action="store_true", help="Delete raw images after PDF creation")
    
    args = parser.parse_args()

    try:
        bibid = normalize_bibid(args.bibid)
    except ValueError as err:
        print(f"Error: {err}", file=sys.stderr)
        sys.exit(1)

    download_book(
        bibid=bibid,
        output_dir=args.output,
        delete_images=args.delete,
        start_page=args.start,
        end_page=args.end
    )

if __name__ == "__main__":
    main()
