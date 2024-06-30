#!/bin/bash

# Function to display a message box and open the Node.js download page
show_message() {
  local message=$1
  local url=$2

  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    zenity --error --text="$message"
    xdg-open "$url"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e "tell app \"System Events\" to display dialog \"$message\" buttons {\"OK\"}" && open "$url"
  elif [[ "$OSTYPE" == "cygwin" || "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    powershell -Command "Add-Type -AssemblyName System.Windows.Forms; if ([System.Windows.Forms.MessageBox]::Show('$message', 'Node.js Not Found', 'OK', 'Error') -eq 'OK') { Start-Process '$url'; }"
  else
    echo "$message"
    if command -v xdg-open &> /dev/null; then
      xdg-open "$url"
    elif command -v open &> /dev/null; then
      open "$url"
    else
      echo "Please open the following URL in your browser: $url"
    fi
  fi
}

# Check if Node.js is installed
if ! command -v node &> /dev/null
then
    echo "Node.js could not be found."

    # Display message and open the download page
    show_message "Node.js is not installed. Please download and install Node.js from https://nodejs.org/" "https://nodejs.org/"

    # Wait for any key press
    read -p "Press Enter key to continue..."
else
    echo "Node.js is installed."

    # Check if node_modules is missing in the data folder
    if [ ! -d "./data/node_modules" ]; then
        echo "Installing node_modules..."
        (cd ./data && npm install)
    fi

    echo "Starting the script..."
    # Run your Node.js script here
    node ./data/Main.js

    # Wait for any key press
    read -p "Press Enter key to continue..."
fi

# Open a text file with the text editor
open_text_file() {
  local file_path=$1

  if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "$file_path"
  elif [[ "$OSTYPE" == "darwin"* ]]; then
    open "$file_path"
  elif [[ "$OSTYPE" == "cygwin" || "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    start "" "$file_path"
  else
    echo "Please open the file manually: $file_path"
  fi
}

# Specify the text file to open
text_file_path="report.log"
open_text_file "$text_file_path"
