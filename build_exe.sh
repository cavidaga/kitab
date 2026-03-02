#!/usr/bin/env bash

# This script generates a Windows standalone .exe using pyinstaller via Wine

echo "Setting up Wine virtual environment for building Windows executable..."

# Check if wine is installed
if ! command -v wine &> /dev/null; then
    echo "Error: 'wine' is not installed."
    echo "Please install Wine first (e.g. 'sudo dnf install wine' on Fedora)"
    exit 1
fi

export WINEPREFIX="$HOME/.wine"

# Check if pip/python is installed in Wine
echo "Verifying Python inside Wine..."
if ! wine python --version &> /dev/null; then
    echo "Error: Python is not installed inside Wine."
    echo "You must download the official Windows Python installer and run it via Wine:"
    echo "  wget https://www.python.org/ftp/python/3.10.11/python-3.10.11-amd64.exe"
    echo "  wine python-3.10.11-amd64.exe"
    exit 1
fi

echo "Installing required dependencies in Wine..."
wine python -m pip install -r requirements.txt
wine python -m pip install pyinstaller

echo "Building executable with Pyinstaller..."
wine python -m PyInstaller --onefile \
    --windowed \
    --icon "GUI/icon.ico" \
    --add-data "GUI/icon.ico;." \
    --add-data "GUI/start_icon.png;." \
    --add-data "GUI/cancel_icon.png;." \
    --name "Kitab" \
    --distpath "Windows" \
    --workpath "build" \
    "GUI/kitab.py"

echo "Cleaning up temporary build artifacts..."
rm -rf build Kitab.spec

echo "Build complete! Check the Windows/ folder."
