import fs from "fs";
import extract from "extract-zip";
import path from "path";
import csv from "csv-parser";


export const generateRandomString = (length = 8) => {
  return Math.random().toString(20).substr(2, length);
};

export const getDateTime = () => {
  let date = new Date();
  let epoch = Date.now();

  let year = date.getFullYear();
  let month = ("0" + (date.getMonth() + 1)).slice(-2);
  let day = ("0" + date.getDate()).slice(-2);
  let hours = date.getHours();
  let minutes = ("0" + (date.getMinutes() + 1)).slice(-2);
  let seconds = ("0" + (date.getSeconds() + 1)).slice(-2);

  return {
    epoch,
    currentDate: year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds,
    currentMonth: `${year}-${month}`
  }
};

export const createFile = (filename) => {
  fs.open(filename,'r',function(err, fd){
    if (err) {
      fs.writeFile(filename, '', function(err) {
          if(err) {
              console.log(err);
          }
          console.log("The file was saved!");
      });
    } else {
      console.log("The file exists!");
    }
  });
}

export const extractZip = async (filePath,destinationPath) => {
  try {
    await extract(filePath, { dir: path.resolve(destinationPath) });
    return true
  } catch (err) {
    return false
  }
}

export const readCsv = (path, options, rowProcessor) => {
  return new Promise((resolve, reject) => {
    const data = [];
    let inputStream = fs.createReadStream(path, "utf8");

    inputStream
      .pipe(csv())
      .on("error", (error) => {
        reject(error);
      })
      .on("data", (row) => {
        const obj = rowProcessor(row);
        /* push data with new array */
        if (obj) data.push(row);
      })
      .on("end", () => {
        resolve(data);
      });
  });
};

export const arrayChunk = (inputArray,perChunk) => {
  return inputArray?.reduce((resultArray, item, index) => { 
      const chunkIndex = Math.floor(index/perChunk)
      
      if(!resultArray[chunkIndex]) {
          resultArray[chunkIndex] = [] // start a new chunk
      }
      
      resultArray[chunkIndex].push(item)
      
      return resultArray
  }, [])
}
