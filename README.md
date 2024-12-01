# AMK Downloader

A desktop application built with Python and Tkinter for downloading and managing book pages from the Azerbaijan National Library digital collection.

## Features

- **Bilingual Interface**: Supports English and Azerbaijani languages
- **Download Management**:
  - Download single books or queue multiple downloads
  - Specify custom page ranges
  - Resume interrupted downloads
  - Progress tracking with visual indicators
- **PDF Creation**: Automatically combines downloaded pages into a single PDF
- **Built-in Viewer**: Preview downloaded pages directly in the application
- **Dark Mode**: Toggle between light and dark themes for comfortable viewing
- **Queue System**: Add multiple books to a download queue
- **Error Handling**: Comprehensive error logging and recovery system
- **Resource Management**: Option to automatically delete image files after PDF creation

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cavidaga/kitab.git
cd kitab
```

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

### Dependencies
- Python 3.7+
- Pillow (PIL)
- PyMuPDF (fitz)
- requests
- tkinter (usually comes with Python)

## Usage

1. Run the application:
```bash
python book_new.py
```

2. Enter the Book ID:
   - Accepts both numeric IDs and IDs with 'vtls' prefix (e.g., "vtls000000004")
   - The ID will be automatically normalized

3. Specify the page range:
   - Start Page (defaults to 1)
   - End Page (optional, defaults to total pages)

4. Select download options:
   - Choose whether to delete original images after PDF creation
   - Enable/disable desktop notifications
   - Select preferred language

5. Click "Start Download" or add to queue for batch processing

## Features in Detail

### Download Queue
- Add multiple books to the download queue
- Process queue sequentially
- Cancel and resume queue processing
- Remove items from queue

### Built-in Viewer
- View downloaded pages before PDF creation
- Navigate between pages
- Automatic image scaling to fit window

### Error Recovery
- Automatic retry on failed downloads
- Comprehensive error logging
- View and clear error logs
- Continue from last successful download

### Localization
Switch between:
- English
- Azərbaycan (Azerbaijani)

## Configuration

Default settings can be modified in the code:
- `DELAY`: Time between page requests (default: 2 seconds)
- `MIN_IMAGE_SIZE`: Minimum valid image size (default: 1024 bytes)
- `retry_limit`: Maximum download attempts (default: 3)
- `retry_delay`: Time between retries (default: 1.0 seconds)

## Error Handling

The application includes:
- Comprehensive error logging
- Thread-safe logging mechanism
- Visual error indicators
- Detailed error messages
- Error log viewer

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for accessing Azerbaijan National Library digital collection
- Uses PyMuPDF for PDF handling
- Interface built with Tkinter for cross-platform compatibility

## Security Note

This application includes basic rate limiting and respects server limitations. Please use responsibly and in accordance with the library's terms of service.

## Disclaimer

This tool is meant for legitimate access to digital library resources. Users are responsible for complying with all applicable laws and terms of service. This application is not affiliated with the Azerbaijan National Library. Created by Javid Agha.

## Contact

Javid Agha - [https://cavid.info](https://cavid.info)

Project Link: [https://github.com/cavidaga/kitab](https://github.com/cavidaga/kitab)
