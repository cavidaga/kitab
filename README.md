# Kitab

A desktop app for downloading books from the [Azerbaijan National Library](http://web2.anl.az:81/read) digital collection. Downloads pages, assembles them into a PDF with catalog metadata, and saves everything locally.

Built with Electron + React. No Python, no extra runtimes — just download and run.

---

## Download

Grab the latest release for your platform from the [Releases page](https://github.com/cavidaga/kitab/releases):

| Platform | File |
|---|---|
| **Windows** | `Kitab Setup x.x.x.exe` |
| **Linux** | `Kitab-x.x.x.AppImage` |

> Windows users: run the installer, click through the wizard, launch from the desktop shortcut.  
> Linux users: `chmod +x Kitab-*.AppImage && ./Kitab-*.AppImage`

---

## Features

- **Download books by ID** — accepts `vtls000000004` or bare numeric IDs
- **Custom page ranges** — start and end page, or download the entire book
- **Queue** — add multiple books, process them one by one
- **PDF assembly** — pages are combined into a single PDF automatically
- **Catalog metadata** — title, author, and year are fetched and embedded in the PDF
- **Delete images after PDF** — keep only the PDF, discard the raw page files
- **Activity log** — timestamped download events, collapsible
- **Bilingual** — English and Azerbaijani interface
- **Dark / Light mode**

---

## Usage

1. Launch the app
2. Paste a Book ID (e.g. `vtls000000004`) into the field
3. Optionally set a start/end page (leave end blank to download everything)
4. Click **Select output folder** to choose where files are saved
5. Click **Download**

To queue several books: fill in a Book ID and click **Add to queue** for each one, then click **Process queue**.

---

## CLI

The headless Python CLI (`kitab_cli.py`) is still available for scripting and server use:

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

**Stack:**
- Electron 33 — desktop shell
- React 18 + Vite — renderer
- pdf-lib — PDF assembly (pure JS, no native deps)
- Node.js built-in `http` — page fetching

**Build installers locally:**
```bash
npm run dist:win    # → dist-electron/Kitab Setup x.x.x.exe
npm run dist:linux  # → dist-electron/Kitab-x.x.x.AppImage
```

CI builds run automatically on GitHub Actions when a version tag is pushed:
```bash
git tag v2.1.0 && git push origin v2.1.0
```

---

## License

MIT — see [LICENSE](LICENSE).

## Disclaimer

This tool is for legitimate access to digital library resources. Users are responsible for complying with applicable laws and the library's terms of service. Not affiliated with the Azerbaijan National Library.

Created by [Javid Agha](https://cavid.info) · [github.com/cavidaga/kitab](https://github.com/cavidaga/kitab)
