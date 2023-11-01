import multer from "multer";
import { existsSync, appendFileSync, mkdirSync } from "fs";
import moment from "moment";

const storage = multer.diskStorage({
  //Specify the destination directory where the file needs to be saved
  destination: function (req, file, cb) {
    let dir = `uploads/${moment().format("YYYYMMDD")}/`;
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  //Specify the name of the file. The date is prefixed to avoid overwriting of files.
  filename: function (req, file, cb) {
    cb(null, file?.originalname);
  },
});

export const upload = multer({
  storage: storage,
});
