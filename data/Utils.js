import { exec  } from 'child_process';
import path from 'path'
import { 
    getDirName/*, getOutputLogFilePath*/
} from './Init.js'
/*import { logMessage, logError, logToFile, getLogLevel } from './Logger.js'
const outputLogFilePath = getOutputLogFilePath();
const logLevel = getLogLevel();*/

const __dirname = getDirName();

/*
Removes predefined terms from mod names to broaden search results
Also splits pascal case into words
*/
export function cleanString(str, blacklist) {
  // Split PascalCase into words
  str = str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2');

  str = str.toLowerCase();
  // Remove blacklist terms
  for (const term of blacklist) {
      str = str.replaceAll(term.toLowerCase(), '');
  }

  return str.trim();
}

export function simplifyString(input) {
    // Step 1: Remove special characters except for letters, digits, and whitespace
    let cleaned = input.replace(/[^a-zA-Z0-9\s]/g, ' ');

    // Step 2: Remove digits that are not part of words
    cleaned = cleaned.replace(/\b\d+\b/g, '');

    return cleaned;
}

export function filterObjectsBySearchString(searchString, objects, fieldName) {
  // Function to clean strings by removing special characters
  function removeSpecialChars(str) {
    return str.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
  }

  // Split the cleaned search string into words
  const searchWords = removeSpecialChars(searchString).split(/\s+/);

  // Function to check if the specified field of an object contains all search words
  function objectContainsAllWords(obj) {
    // Get the cleaned field value
    const fieldValue = removeSpecialChars(obj[fieldName] || '');

    // Check if all words in searchWords are present in fieldValue
    return searchWords.every(word => fieldValue.includes(word));
  }

  // Filter the array of objects
  const filteredObjects = objects.filter(objectContainsAllWords);

  // Sort the filtered objects by the number of words in the field value
  return filteredObjects.sort((a, b) => {
    const aWordCount = (removeSpecialChars(a[fieldName] || '').match(/\b\w+\b/g) || []).length;
    const bWordCount = (removeSpecialChars(b[fieldName] || '').match(/\b\w+\b/g) || []).length;
    return aWordCount - bWordCount;
  });
}

export function getCurrentDateTimeWithMilliseconds(isFilenameComponent) {
    const now = new Date();
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
    let str;

    if (isFilenameComponent){
      str = `${year}-${month}-${day}_${hours}.${minutes}.${seconds}.${milliseconds}`;
    }
    else{
      str = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
    }

    return str;
  }
  
// Path to the PowerShell script
const psScriptPath = path.join(__dirname, 'selectFolder.ps1');

// Function to run the PowerShell script
export function selectFolder() {
  return new Promise((resolve, reject) => {
    exec(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${error.message}`);
      }
      if (stderr) {
        reject(`Stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}


export default { cleanString, simplifyString, filterObjectsBySearchString, getCurrentDateTimeWithMilliseconds, selectFolder };