import fs from 'fs-extra'
import { 
    getLogLevel
} from './Init.js'
import { getCurrentDateTimeWithMilliseconds } from './Utils.js'

const logLevel = getLogLevel();

export function logMessage(message, logLvl = 1, logFilename) {
    message = typeof message === 'string' ? message : JSON.stringify(message, null, 2);

    const date = getCurrentDateTimeWithMilliseconds();
    let color;

    switch (logLvl){
        case (logLevel.DEBUG):
            color = '\x1b[32m';
        break;
        case (logLevel.INFO):
            color = '\x1b[37m';
        break;
        case (logLevel.WARNING):
            color = '\x1b[33m';
        break;
        case (logLevel.ERROR):
            color = '\x1b[31m';
        break;
    }

    console.log(`${color}${date} - ${message}\x1b[0m`);
    
    if (!!logFilename)
        logToFile(logFilename, `${date} - ${message}`);
}

export function logError(message, error){
    console.error(`\x1b[41m${getCurrentDateTimeWithMilliseconds()} - ${message}\x1b[0m`, error);
}

export function logToFile(filePath, msg){
    fs.appendFileSync(filePath, `${msg}\n`);
}

export default { logMessage, logError, logToFile };