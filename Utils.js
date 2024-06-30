import fs from 'fs-extra'

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
    
/*
Creates if not exists, reads and parses a given config file
*/
export function initConfig(fn, defaultConfig){
    if (!fs.existsSync(fn)){
        fs.writeFileSync(fn, JSON.stringify(defaultConfig));
    }

    try{
        return JSON.parse(fs.readFileSync(fn));
    }
    catch(e){
        return null;
    }
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
  

export default { cleanString, simplifyString, initConfig, filterObjectsBySearchString };