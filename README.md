<div align="center">

<h1>Kitab</h1>
<p>Download books from the <a href="http://web2.anl.az:81/read">Azerbaijan National Library</a> digital collection as PDFs.</p>

<a href="https://github.com/cavidaga/kitab/releases/latest/download/Kitab-Setup-x64.exe">
  <img src="https://img.shields.io/badge/Download_for-Windows-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download for Windows" />
</a>
&nbsp;
<a href="https://github.com/cavidaga/kitab/releases/latest/download/Kitab-linux.deb">
  <img src="https://img.shields.io/badge/Download_for-Ubuntu_/_Debian-A81D33?style=for-the-badge&logo=ubuntu&logoColor=white" alt="Download for Ubuntu / Debian (.deb)" />
</a>
&nbsp;
<a href="https://github.com/cavidaga/kitab/releases/latest/download/Kitab-linux.AppImage">
  <img src="https://img.shields.io/badge/Download_for-Linux_(AppImage)-E95420?style=for-the-badge&logo=linux&logoColor=white" alt="Download for Linux AppImage" />
</a>
&nbsp;
<a href="https://github.com/cavidaga/kitab/releases/latest/download/Kitab-mac-arm64.dmg">
  <img src="https://img.shields.io/badge/Download_for-macOS_(Apple_Silicon)-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Download for macOS Apple Silicon" />
</a>
&nbsp;
<a href="https://github.com/cavidaga/kitab/releases/latest/download/Kitab-mac-x64.dmg">
  <img src="https://img.shields.io/badge/Download_for-macOS_(Intel)-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Download for macOS Intel" />
</a>
&nbsp;
<a href="https://github.com/cavidaga/kitab/releases">
  <img src="https://img.shields.io/github/v/release/cavidaga/kitab?style=for-the-badge&label=Latest%20Release&color=2ea44f" alt="Latest Release" />
</a>

</div>

---

## Features

- **Download books by ID** — accepts `vtls000000004` or bare numeric IDs
- **Custom page ranges** — start and end page, or download the entire book
- **Queue** — add multiple books, process them one by one
- **PDF assembly** — pages combined into a single PDF automatically
- **Catalog metadata** — title, author, and year fetched and embedded in the PDF
- **Delete images after PDF** — keep only the PDF, discard the raw page files
- **Activity log** — timestamped download events, collapsible
- **Bilingual** — English and Azerbaijani interface
- **Dark / Light mode**

---

## Installation

**Windows** — Run `Kitab-Setup-x64.exe` and follow the installer wizard. A desktop shortcut and Start Menu entry are created automatically.

> **"Windows protected your PC" warning** — This appears because the app isn't signed with a paid code-signing certificate. Click **More info → Run anyway** to proceed. The app is open source and the full code is in this repository.

**Linux (.deb)** — Install the native package on Debian/Ubuntu:
```bash
sudo apt install ./Kitab-linux.deb
```

**Linux (.AppImage)** — Make it executable and run it:
```bash
chmod +x Kitab-linux.AppImage
./Kitab-linux.AppImage
```
> **AppImage FUSE error?** Modern Linux distros (Ubuntu 22.04+) require FUSE 2. If you see `dlopen(): error loading libfuse.so.2`, you can either install it (`sudo apt install libfuse2`) or use the `.deb` version instead.

**macOS** — Open the `.dmg`, drag Kitab to Applications. Use `arm64` for Apple Silicon (M1/M2/M3) or `x64` for Intel Macs.

> **"Kitab can't be opened" (macOS Gatekeeper)** — Right-click the app → **Open** → **Open** to bypass the warning on first launch. This appears because the app isn't notarized with an Apple Developer certificate.

---

## Usage

1. Launch the app
2. Paste a Book ID (e.g. `vtls000000004`) into the field
3. Optionally set a start/end page (leave end blank for the whole book)
4. Click **Select output folder** to choose where files are saved
5. Click **Download**

To queue several books: fill in a Book ID and click **Add to queue** for each one, then click **Process queue**.

---

## CLI

The headless Python CLI is available for scripting and server use:

```bash
python3 kitab_cli.py vtls000000004 -o ~/books -s 1 -e 50 -d
```

```
positional arguments:
  bibid                 Book ID (e.g. vtls000000004 or 4)

options:
  -o, --output DIR      Output directory (default: current directory)
  -s, --start N         Start page (default: 1)
  -e, --end N           End page (default: last page)
  -d, --delete          Delete images after PDF creation
  --json                Emit newline-delimited JSON events (for tooling)
```

CLI dependencies: `pip install requests Pillow PyMuPDF`

---

## Development

```bash
git clone https://github.com/cavidaga/kitab.git
cd kitab/electron-app
npm install
npm run dev        # Vite + Electron dev mode
```

**Build installers locally:**
```bash
npm run dist:win    # → dist-electron/Kitab-Setup-x64.exe
npm run dist:linux  # → dist-electron/Kitab-x64.AppImage
```

**Release via CI** — push a version tag and GitHub Actions builds all platforms automatically:
```bash
git tag v2.1.0 && git push origin v2.1.0
```

**Stack:** Electron 33 · React 18 · Vite · pdf-lib

---

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

This tool is for legitimate access to digital library resources. Users are responsible for complying with applicable laws and the library's terms of service. Not affiliated with the Azerbaijan National Library.

Created by [Javid Agha](https://cavid.info) · [github.com/cavidaga/kitab](https://github.com/cavidaga/kitab)
