import { exec  } from 'child_process';
import path from 'path'
import { 
    getDirName
} from './Init.js'

const __dirname = getDirName();

/*
Removes predefined terms from mod names to broaden search results
*/
export function cleanString(str, blacklist){
    for (const term of blacklist){
        str = str.replaceAll(term, '');
    }

    return str;
}

export function simplifyString(input) {
    // Step 1: Remove special characters except for letters, digits, and whitespace
    let cleaned = input.replace(/[^a-zA-Z0-9\s]/g, '');

    // Step 2: Remove digits that are not part of words
    cleaned = cleaned.replace(/\b\d+\b/g, '');

    return cleaned;
}

export function filterObjectsBySearchString(searchString, objects, fieldName) {
    // Split the search string into words and convert to lower case
    const searchWords = searchString.toLowerCase().split(/\s+/);
  
    // Function to check if the specified field of an object contains all search words
    function objectContainsAllWords(obj) {
      // Get the field value, convert to lower case
      const fieldValue = obj[fieldName]?.toLowerCase() || '';
  
      // Check if all words in searchWords are present in fieldValue
      return searchWords.every(word => fieldValue.includes(word));
    }
  
    // Filter the array of objects
    return objects.filter(objectContainsAllWords);
}

export function getCurrentDateTimeWithMilliseconds() {
    const now = new Date();
  
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
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