import fs from 'fs-extra'
import path from 'path'
import { initConfig } from './Utils.js'

const logLevel = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
}

const modrinthApiURL = 'https://api.modrinth.com/v2';
const GETOptions = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json;charset=UTF-8',
      'User-Agent': 'ModpackUpdateManager'
    }
  };

const outputFolder = 'output';
const reportLogFn = 'report.log';
const reportLogFilePath = path.join(outputFolder, reportLogFn);
const modsFolder = 'mods';
const alternateFolder = 'alternateVersions';
const configFn = 'ModpackUpdateManagerModrinth-config.json';
const defaultSearchTermBlacklistFn = 'searchTermBlacklist.json';

const defaultSearchTermBlacklist = [
    'edition',
    'port',
    'unofficial'
  ]
  
const defaultConfig = {
    versions: [
        '1.12', 
        '1.12.1', 
        '1.12.2', 
        '1.14.4', 
        '1.15.2', 
        '1.16.1', 
        '1.16.2', 
        '1.16.3', 
        '1.16.4', 
        '1.16.5', 
        '1.17', 
        '1.17.1', 
        '1.18', 
        '1.18.1', 
        '1.18.2', 
        '1.19',
        '1.19.2',
        '1.20.1',
        '1.20.2',
        '1.20.3',
        '1.20.4',
        '1.20.5',
        '1.20.6'
    ],
    modLoaders: [
        'fabric', 
        'forge', 
        'neoforge', 
        'quilt'
    ]
}

const reportObj = {
    found: [],
    alternate: [],
    missing: []
}

if (!fs.existsSync(outputFolder)){
    fs.mkdirSync(outputFolder);
}

if (!fs.existsSync(path.join(outputFolder, modsFolder))){
    fs.mkdirSync(path.join(outputFolder, modsFolder));
}

if (!fs.existsSync(path.join(outputFolder, modsFolder, alternateFolder))){
    fs.mkdirSync(path.join(outputFolder, modsFolder, alternateFolder));
}

const config = initConfig(configFn, defaultConfig);
const searchTermBlacklist = initConfig(defaultSearchTermBlacklistFn, defaultSearchTermBlacklist);

fs.writeFileSync(reportLogFilePath, '');

if (!config){
    logMessage(`Could not parse config JSON. Correct ${configFn} or delete it to reset.`, logLevel.ERROR);
    process.exit(-1);
}

if (!searchTermBlacklist){
    logMessage(`Could not parse searchTermBlacklist JSON. Correct ${defaultSearchTermBlacklistFn} or delete it to reset.`, logLevel.ERROR);
    process.exit(-1);
}

export function getModrinthApi(){
    return modrinthApiURL;
}
export function getGETOptions(){
    return GETOptions;
}
export function getOutputFolder(){
    return outputFolder;
}
export function getReportLogFilePath(){
    return reportLogFilePath;
}
export function getModsFolder(){
    return modsFolder;
}
export function getAlternateFolder(){
    return alternateFolder;
}
export function getReportObj(){
    return reportObj;
}
export function getConfig(){
    return config;
}
export function getSearchTermBlacklist(){
    return searchTermBlacklist;
}
export function getLogLevel(){
    return logLevel;
}

export default { 
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
};