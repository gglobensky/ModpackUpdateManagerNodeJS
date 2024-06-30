import fs from 'fs-extra'
import { Readable } from "stream";
import { logError } from './Logger.js'

export async function fetchData(url, options, hide404 = true) {
    try {
        // Make the fetch request and wait for the response
        const response = await fetch(url, options);
        
        // Check if the response is OK (status code 200-299)
        if (!response.ok) {

            if (!(response.status === 404 && hide404)){
                logError(`HTTP error! status: ${response.status}`, response.statusText);
            }

            return { isError: true, statusCode: response.status };
        }

        const data = await response.json();
        
        return data;
    } catch (error) {
      logError('Fetch error:', error);
    }
  }

  export async function downloadFile(url, options, path) {
    try {
        // Make the fetch request and wait for the response
        const response = await fetch(url, options);
        
        // Check if the response is OK (status code 200-299)
        if (!response.ok) {
            logError(`HTTP error! status: ${response.status}`);
            return { isError: true, statusCode: response.status };
        }

        if (!!response.body) {
            let writer = fs.createWriteStream(path);
            Readable.fromWeb(response.body).pipe(writer);
        }
    } catch (error) {
      logError('Fetch error:', error);
    }
  }

  export default { fetchData, downloadFile };