/*TODO -> 
ask for mods file path - 
ask for version to update to -
scan all mods jar files and get 
    mod name
    create searchable mod name (remove weird chars and all)
    put in list of objects
Search for mods from list of objects
    if name is found 
        download mod
        validate mod jar metadata name matches with name from the original one (regular name we saved)
        if name doesnt match
            create if not exist a folder named mismatch
            move mod into it

when list is gone through:
    Message user and tell about mismatch folder and other details
*/


import inquirer from 'inquirer'
import fs from 'fs-extra'
import path from 'path'
import AdmZip from 'adm-zip';
import toml from 'toml';
import { cleanString, simplifyString, filterObjectsBySearchString } from './Utils.js'
import { logMessage, logError, logToFile } from './Logger.js'
import { fetchData, downloadFile } from './WebClient.js'
import { 
    getModrinthApi,
    getGETOptions,
    getOutputFolder,
    getReportLogFilePath,
    getModsFolder,
    getAlternateFolder,
    getReportObj,
    getConfig,
    getSearchTermBlacklist,
    getLogLevel
} from './Init.js'

const modrinthApiURL = getModrinthApi();
const GETOptions = getGETOptions();
const outputFolder = getOutputFolder();
const reportLogFilePath = getReportLogFilePath();
const modsFolder = getModsFolder();
const alternateFolder = getAlternateFolder();
const reportObj = getReportObj();
const config = getConfig();
const searchTermBlacklist = getSearchTermBlacklist();
const logLevel = getLogLevel();

const questions = [
    {
      type: 'input',
      name: 'modFolder',
      message: 'Please enter the path of your mod folder.',
      validate: (value) => {
          const isValid = fs.existsSync(value);
          return isValid ? isValid : 'Please enter a valid path';
      }
    },
    {
        type: 'list',
        name: 'modLoader',
        message: 'Please choose the Minecraft modLoader to update to.',
        choices: config.modLoaders
    },
    {
        type: 'list',
        name: 'version',
        message: 'Please choose the Minecraft version to update to.',
        choices: config.versions
    }
];

main();

async function main(){
    const answers = await inquirer.prompt(questions);
    const modData = await processJarFiles(answers.modFolder);
    
    const modsToFindAlternates = [];

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Iterate through every mod in the source folder
    for (const datum of modData){
        const success = await downloadMod(datum, answers.modLoader, answers.version);

        if (!success){
            modsToFindAlternates.push(datum);
        }
        else{
            reportObj.found.push(`${datum.displayName} - Found and downloaded successfully.`);
        }

        await delay(2000)
    }
    
    for (const modToSearch of modsToFindAlternates){
        logMessage(`Trying to find alternate mod version for ${modToSearch.displayName}`);
        const response = await fetchData(`${modrinthApiURL}/search?query=${encodeURIComponent(modToSearch.searchName)}`, GETOptions)

        if (response.isError){
            logMessage(`Problem searching for mod ${modToSearch.displayName} with search term ${modToSearch.searchName}. Skipping...`, logLevel.WARNING);
            reportObj.missing.push(`${modToSearch.displayName} - Problem searching for mod with search term ${modToSearch.searchName}. Skipped.`);
            continue;
        }

        let candidates = filterObjectsBySearchString(modToSearch.searchName, response.hits, 'title');

        if (candidates.length === 0){
            modToSearch.searchName = simplifyString(modToSearch.searchName);
            candidates = filterObjectsBySearchString(modToSearch.searchName, response.hits, 'title');
        }
        
        if (candidates.length === 0){
            logMessage(`Could not find suitable alternative for ${modToSearch.displayName} with search term ${modToSearch.searchName}. Skipping...`);
            reportObj.missing.push(`${modToSearch.displayName} -  with search term ${modToSearch.searchName}. Skipped.`);
            continue;
        }

        for (const candidate of candidates){
            const searchName = cleanString(candidate.title, searchTermBlacklist);
            const success = downloadMod({ displayName: candidate.title, modId: candidate.slug, searchName: searchName }, answers.modLoader, answers.version, true);

            if (success){
                reportObj.alternate.push(`${modToSearch.displayName} - Found and downloaded alternate version named ${candidate.title}.`);
                break;
            }
        }
        
        await delay(2000)
    }

    logToFile(reportLogFilePath, JSON.stringify(reportObj, null, 2));
}

async function downloadMod(modData, modLoader, version, isAlternate = false){
    const response = await fetchData(`${modrinthApiURL}/project/${modData.modId}/version`, GETOptions)
    if (response.isError){
        logMessage(`${modData.displayName} - Did not find exact modId on Modrinth. Will try to search for an alternate version.`);
        
        return false;
    }
    else{
        const mods = response.filter(elem => elem.game_versions.includes(version) && elem.loaders.includes(modLoader));
        const mod = mods.length === 0? null : 
        mods.reduce((prev, current) => {
                        return new Date(prev.date_published) > new Date(current.date_published) ? prev : current
                    });
                                                    
        if (mod === null){   
            let msg = `${modData.displayName} - Did not find mod for version ${version} and loader ${modLoader}.`;

            if (!isAlternate)
                msg += ' Will try to search for an alternate version.';

            logMessage(msg);
            
            return false;
        }

        let downloadURL = mod.files.find(elem => elem.primary)?.url;

        if (!downloadURL){
            downloadURL = mod.files[0].url;
        }

        if (!downloadURL){
            console.log(JSON.stringify(mod.files, null, 2))
            return false;
        }

        const filename = decodeURIComponent(downloadURL.split("/").pop());

        logMessage(`Downloading file: ${filename}`);

        let filePath = path.join(outputFolder, modsFolder);

        if (isAlternate){
            filePath = path.join(filePath, alternateFolder);
        }

        await downloadFile(downloadURL, GETOptions, path.join(filePath, filename));
        
        return true;
    }
}


// Function to read mods.toml from a JAR file
async function readModsTomlFromJar(jarFilePath) {
    try {
      const zip = new AdmZip(jarFilePath);
      const modsTomlEntry = zip.getEntry('META-INF/mods.toml');
      
      if (modsTomlEntry) {
        const modsTomlContent = modsTomlEntry.getData().toString('utf8');
        const parsedToml = toml.parse(modsTomlContent);
        
        const displayName = parsedToml.mods?.[0]?.displayName || 'Unknown';
        const searchName = cleanString(parsedToml.mods?.[0]?.displayName, searchTermBlacklist) || 'Unknown';
        const modId = parsedToml.mods?.[0]?.modId || 'Unknown';
        
        return { displayName, modId, searchName };
      } else {
        logMessage(`No mods.toml found in ${jarFilePath}`, logLevel.ERROR);
        return null;
      }
    } catch (error) {
      logError(`Error reading ${jarFilePath}:`, error);
      return null;
    }
}
  
  // Function to process all JAR files in a directory
async function processJarFiles(directory) {
    try {
      const files = await fs.readdir(directory);
      const modDetailsList = [];
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        
        if (path.extname(file) === '.jar') {
          const modDetails = await readModsTomlFromJar(filePath);
          
          if (modDetails) {
            modDetailsList.push(modDetails);
          }
        }
      }
      
      return modDetailsList;
    } catch (error) {
      logError('Error processing JAR files:', error);
      return [];
    }
}