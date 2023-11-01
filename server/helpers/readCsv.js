 
 import fs from 'fs';
 import csv from "csv-parser";

 const readCsv = (path, options, rowProcessor) => {
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

export default readCsv