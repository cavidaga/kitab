# Book Downloader

A Python-based desktop application for downloading and converting books to PDF format. This application features a bilingual interface (English and Azerbaijani) and includes dark/light mode support.

## Features

- Bilingual interface (English/Azerbaijani)
- Dark/Light mode toggle
- PDF conversion with image cleanup
- Configurable retry mechanism for failed downloads
- Progress tracking
- Error logging
- Cross-platform compatibility

## Requirements

```
Python 3.x
tkinter
requests
Pillow
```

## Installation

1. Clone this repository:
```bash
git clone https://github.com/cavidaga/book-downloader.git
cd book-downloader
```

2. Install required packages:
```bash
pip install -r requirements.txt
```

## Usage

1. Run the application:
```bash
python book_new.py
```

2. Configure the following settings:
   - Book ID: Enter the ID of the book you want to download
   - Retry Limit: Set maximum number of retry attempts
   - Retry Delay: Set delay between retry attempts (in seconds)
   - Delete Images: Toggle automatic cleanup of temporary image files

3. Select your preferred language (English/Azerbaijani)

4. Choose output directory when prompted

5. Click "Start Download" to begin the process

## Features Explained

### Language Support
- Supports English and Azerbaijani
- Dynamic UI updates when language is changed
- Maintains language selection during runtime

### Dark/Light Mode
- Toggle between dark and light themes
- Persists during application session
- Affects all UI elements including progress bar

### Download Management
- Configurable retry mechanism for resilient downloads
- Progress tracking with visual feedback
- Cancellable downloads
- Detailed logging of operations

### PDF Creation
- Automatic conversion of downloaded images to PDF
- Optional cleanup of temporary image files
- Maintains image quality during conversion

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This application is not affiliated with the Azerbaijan National Library. Created by Javid Agha.

## Contact

Javid Agha - [https://cavid.info](https://cavid.info)

Project Link: [https://github.com/cavidaga/kitab](https://github.com/cavidaga/kitab)
