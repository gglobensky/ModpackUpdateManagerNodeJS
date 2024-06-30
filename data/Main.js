/*TODO -> 
Sort mod search result by the number of words. The less words first to have a better match --
Configure saving log output to file --
Put all search names in lowercase --
*/


import inquirer from 'inquirer'
import fs from 'fs-extra'
import path from 'path'
import AdmZip from 'adm-zip';
import toml from 'toml';
import { cleanString, simplifyString, filterObjectsBySearchString, selectFolder } from './Utils.js'
import { logMessage, logError, logToFile, getLogLevel } from './Logger.js'
import { fetchData, downloadFile } from './WebClient.js'
import { 
    getModrinthApi,
    getGETOptions,
    getOutputFolder,
    getReportLogFilePath,
    getOutputLogFilePath,
    getModsFolder,
    getAlternateFolder,
    getReportObj,
    getConfig
} from './Init.js'

const modrinthApiURL = getModrinthApi();
const GETOptions = getGETOptions();
const outputFolder = getOutputFolder();
const reportLogFilePath = getReportLogFilePath();
const modsFolder = getModsFolder();
const alternateFolder = getAlternateFolder();
const reportObj = getReportObj();
const config = getConfig();
const logLevel = getLogLevel();
const outputLogFilePath = config.logOutputToFile ? getOutputLogFilePath() : null;

let versionQuestion = {
    type: 'input',
    name: 'version',
    message: 'Please input the Minecraft version to update to.',
    validate: (value) => {
        const isValid = config.versions.includes(value);
        return isValid ? isValid : `Please enter a version from the following: ${JSON.stringify(config.versions, null, 2)}`;
    }
};

if (config.chooseVersionFromList){
    versionQuestion = {
        type: 'list',
        name: 'version',
        message: 'Please choose the Minecraft version to update to.',
        choices: config.versions
    };
}

const questions = [
    {
        type: 'list',
        name: 'modLoader',
        message: 'Please choose the Minecraft modLoader to update to.',
        choices: config.modLoaders
    },
    versionQuestion
];

if (!config.specifyPathWithDialog){
    questions.unshift({
        type: 'input',
        name: 'modFolder',
        message: 'Please enter the path of your mod folder.',
        validate: (value) => {
            const isValid = fs.existsSync(value);
            return isValid ? isValid : 'Please enter a valid path';
        }
      });
}

main();

async function main(){
    let modFolderFromDialog = '';

    if (config.specifyPathWithDialog){    
        logMessage('Please select your source mod folder.', logLevel.INFO, outputLogFilePath);
        modFolderFromDialog = await selectFolder();

        if (modFolderFromDialog === 'Dialog canceled') {
            logError('User canceled the dialog.', '');
            process.exit(0);
        }
    }

    const answers = await inquirer.prompt(questions);

    const modData = await processJarFiles(config.specifyPathWithDialog? modFolderFromDialog : answers.modFolder);
    
    const modsToFindAlternates = [];

    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Iterate through every mod in the source folder
    for (const datum of modData){
        // Try to download directly from the modId in the mod metadata
        const filename = await downloadMod(datum, answers.modLoader, answers.version);

        if (filename === null){
            modsToFindAlternates.push(datum);
        }
        else{
            reportObj.found.push(`${datum.displayName} - Found and downloaded successfully with filename ${filename}.`);
        }

        await delay(500);
    }
    
    for (const modToSearch of modsToFindAlternates){
        logMessage(`Trying to find alternate mod version for ${modToSearch.displayName}`, logLevel.INFO, outputLogFilePath);
        // Search with the mod's display name modified (put to lowercase, removed useless words, etc...)
        const response = await fetchData(`${modrinthApiURL}/search?query=${encodeURIComponent(modToSearch.searchName)}`, GETOptions)

        if (response.isError){
            logMessage(`Problem searching for mod ${modToSearch.displayName} with search term ${modToSearch.searchName}. Skipping...`, logLevel.WARNING, outputLogFilePath);
            reportObj.missing.push(`${modToSearch.displayName} - Problem searching for mod with search term ${modToSearch.searchName}. Skipped.`);
            continue;
        }

        let candidates = filterObjectsBySearchString(modToSearch.searchName, response.hits, 'title');

        if (candidates.length === 0){
            modToSearch.searchName = simplifyString(modToSearch.searchName);
            candidates = filterObjectsBySearchString(modToSearch.searchName, response.hits, 'title');
        }
        
        if (candidates.length === 0){
            logMessage(`Could not find suitable alternative for ${modToSearch.displayName} with search term ${modToSearch.searchName}. Skipping...`, logLevel.INFO, outputLogFilePath);
            reportObj.missing.push(`${modToSearch.displayName} - Could not find suitable alternative with search term ${modToSearch.searchName}. Skipped.`);
            continue;
        }

        for (const candidate of candidates){
            const searchName = cleanString(candidate.title.toLowerCase(), config.searchTermBlacklist);
            const filename = await downloadMod({ displayName: candidate.title, modId: candidate.slug, searchName: searchName }, answers.modLoader, answers.version, true);

            if (!!filename){
                reportObj.alternate.push(`${modToSearch.displayName} - Found and downloaded alternate version named ${candidate.title} with filename ${filename}.`);
                break;
            }
        }
        
        await delay(500);
    }

    const msg = JSON.stringify(reportObj, null, 2);

    logToFile(reportLogFilePath, msg);
    logMessage(msg, logLevel.INFO, outputLogFilePath);
    logMessage('Please review the mods in the alternateVersions folder and copy them in the mods folder if they are correct.', logLevel.WARNING, outputLogFilePath);
}

async function downloadMod(modData, modLoader, version, isAlternate = false){
    const response = await fetchData(`${modrinthApiURL}/project/${modData.modId}/version`, GETOptions)
    if (response.isError){
        logMessage(`${modData.displayName} - Did not find exact modId on Modrinth. Will try to search for an alternate version.`, logLevel.INFO, outputLogFilePath);
        
        return null;
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

            logMessage(msg, logLevel.INFO, outputLogFilePath);
            
            return null;
        }

        let downloadURL = mod.files.find(elem => elem.primary)?.url;

        if (!downloadURL){
            downloadURL = mod.files[0].url;
        }

        if (!downloadURL){
            console.log(JSON.stringify(mod.files, null, 2))
            return null;
        }

        const filename = decodeURIComponent(downloadURL.split('/').pop());

        logMessage(`Downloading file: ${filename}`, logLevel.INFO, outputLogFilePath);

        let filePath = path.join(outputFolder, modsFolder);

        if (isAlternate){
            filePath = path.join(filePath, alternateFolder);
        }

        await downloadFile(downloadURL, GETOptions, path.join(filePath, filename));
        
        return filename;
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
        const searchName = cleanString(parsedToml.mods?.[0]?.displayName.toLowerCase(), config.searchTermBlacklist) || 'Unknown';
        const modId = parsedToml.mods?.[0]?.modId || 'Unknown';
        
        return { displayName, modId, searchName };
      } else {
        logMessage(`No mods.toml found in ${jarFilePath}`, logLevel.ERROR, outputLogFilePath);
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