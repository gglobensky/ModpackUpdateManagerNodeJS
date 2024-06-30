import fs from 'fs-extra'
import { getCurrentDateTimeWithMilliseconds } from './Utils.js'

const logLevel = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3
}

export function getLogLevel(){
    return logLevel;
}

export function logMessage(message, logLvl = 1, logFilename) {
    message = typeof message === 'string' ? message : JSON.stringify(message, null, 2);

    const date = getCurrentDateTimeWithMilliseconds();
    let color;
    let levelStr;

    switch (logLvl){
        case (logLevel.DEBUG):
            color = '\x1b[32m';
            levelStr = 'DEBUG';
        break;
        case (logLevel.INFO):
            color = '\x1b[37m';
            levelStr = 'INFO';
        break;
        case (logLevel.WARNING):
            color = '\x1b[33m';
            levelStr = 'WARNING';
        break;
        case (logLevel.ERROR):
            color = '\x1b[31m';
            levelStr = 'ERROR';
        break;
    }

    console.log(`${color}${date} - ${message}\x1b[0m`);
    
    if (!!logFilename)
        logToFile(logFilename, `${levelStr}: ${date} - ${message}`);
}

export function logError(message, error){
    console.error(`\x1b[41m${getCurrentDateTimeWithMilliseconds()} - ${message}\x1b[0m`, error);
}

export function logToFile(filePath, msg){
    fs.appendFileSync(filePath, `${msg}\n`);
}

export default { logMessage, logError, logToFile, getLogLevel };