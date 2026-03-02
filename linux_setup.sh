#!/usr/bin/env bash

echo "Setting up AMK Downloader (Kitab) for Linux..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is not installed. Please install python3 first."
    exit 1
fi

# Check for tkinter, which is often a separate package on Linux
if ! python3 -c "import tkinter" &> /dev/null; then
    echo "Warning: tkinter is not installed for python3."
    echo "You may need to install it. For example, on Ubuntu/Debian:"
    echo "  sudo apt-get install python3-tk"
    echo "On Fedora:"
    echo "  sudo dnf install python3-tkinter"
    echo ""
fi

# Check for PIL.ImageTk, which is also a separate package on Linux systems
if ! python3 -c "from PIL import ImageTk" &> /dev/null; then
    echo "Warning: Pillow Tkinter support (ImageTk) is not installed."
    echo "You will need to install it via your system package manager."
    echo "On Ubuntu/Debian:"
    echo "  sudo apt-get install python3-pil.imagetk"
    echo "On Fedora:"
    echo "  sudo dnf install python3-pillow-tk"
    echo ""
fi

# Make the python script executable
chmod +x GUI/kitab.py
echo "Made GUI/kitab.py executable."

# Desktop entry generation
DESKTOP_FILE="$HOME/.local/share/applications/kitab.desktop"
PROJECT_DIR="$(pwd)"

echo "Creating desktop entry at $DESKTOP_FILE..."

# Provide .desktop file in the home directory
mkdir -p "$HOME/.local/share/applications"

cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Version=1.0
Name=AMK Downloader
Comment=Download and manage book pages from the Azerbaijan National Library
Exec=/usr/bin/env python3 $PROJECT_DIR/GUI/kitab.py
Path=$PROJECT_DIR/GUI
Icon=$PROJECT_DIR/GUI/icon.ico
Terminal=false
Type=Application
Categories=Education;Utility;
Keywords=book;downloader;pdf;library;
EOF

# Update desktop database if the command is available
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications"
fi

echo "Setup complete! You should now be able to launch 'AMK Downloader' from your desktop application menu."
echo "Please make sure you have installed the python dependencies via:"
echo "  pip install -r requirements.txt"
