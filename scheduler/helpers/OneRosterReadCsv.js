import fs from "fs";
import csv from "csv-parser";

const manifestFiles = ["file.orgs", "file.users", "file.roles"];

const readCsv = (path, options, rowProcessor) => {
  try {
    return new Promise((resolve, reject) => {
      const data = [];
      let inputStream = fs.createReadStream(path, "utf8");

      inputStream
        .pipe(csv())
        .on("error", (error) => {})
        .on("data", (row) => {
          const obj = rowProcessor(row);
          /* push data with new array */
          if (obj) data.push(row);
        })
        .on("end", () => {
          resolve(data);
        });
    });
  } catch (err) {
    // console.log(err)
  }
};

const OneRosterReadCsv = async (path, filename) => {
  let csv = false;
  switch (filename) {
    case "manifest":
      csv = await readCsv(
        `${path}/${filename}.csv`,
        { headers: true },
        (row) =>
          manifestFiles.includes(row.propertyName) && row.value != "absent"
      );
      break;
    default:
      csv = await readCsv(
        `${path}/${filename}.csv`,
        { headers: true },
        (row) => row
      );
      break;
  }
  return csv;
};

export { OneRosterReadCsv, readCsv };
