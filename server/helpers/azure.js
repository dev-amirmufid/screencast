import {readFileSync,existsSync, mkdirSync, unlinkSync} from 'fs'
import fsExtra from "fs-extra";
import { extractZip,readCsv } from './utility.js';

export const extractFile = async (folderName) => {
  try {
    const filePath = `${folderName}.zip`
    const tempPath = `temp/${folderName}`

    const extract = await extractZip(filePath, tempPath);
    return extract
  } catch (err) {
    console.error("helper/azure extractFile =>>>>" + err);
    return false
  }
}

export const getBlobCSV = async (folderName,filename,rowProcessor = (row) => row) => {
  try {
    let proc = true
    const tempPath = `temp/${folderName}/${filename}`
    if(!existsSync(tempPath)){
      const extract = extractFile(folderName)
      if(!extract) proc = false
    }

    if(proc){
      const dataCsv = await readCsv(tempPath, { allowQuotes: false, asObject: true }, rowProcessor);
      return dataCsv;
    } else {
      return false
    }
  } catch (err) {
    console.error("helper/azure getBlobCSV =>>>>" + err);
    return false
  }
}
