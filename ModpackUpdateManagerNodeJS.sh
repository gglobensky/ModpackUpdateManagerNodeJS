#!/bin/bash

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js could not be found."

    # Display message box based on OS and open the download page on "OK"
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        zenity --error --text="Node.js is not installed. Please download and install Node.js from https://nodejs.org/"
        xdg-open https://nodejs.org/
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        osascript -e 'tell app "System Events" to display dialog "Node.js is not installed. Please download and install Node.js from https://nodejs.org/" buttons {"OK"}' && open https://nodejs.org/
    elif [[ "$OSTYPE" == "cygwin" || "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        powershell -Command "Add-Type -AssemblyName System.Windows.Forms; if ([System.Windows.Forms.MessageBox]::Show('Node.js is not installed. Please download and install Node.js from https://nodejs.org/', 'Node.js Not Found', 'OK', 'Error') -eq 'OK') { Start-Process 'https://nodejs.org' }"
    else
        echo "Please download and install Node.js from https://nodejs.org/"
    fi

    # Wait for any key press
    read -p "Press Enter key to continue..."
else
    echo "Node.js is installed."

    # Check if node_modules is missing in the data folder
    if [ ! -d "./data/node_modules" ]; then
        echo "node_modules folder is missing in the data folder. Running npm install..."
        (cd ./data && npm install)
    fi

    echo "Starting the script..."
    # Run your Node.js script here
    node ./data/Main.js

    # Wait for any key press
    read -p "Press Enter key to continue..."
fi
