import writecsv from "../helpers/wtirecsv.js";
import { getRoom } from "../socket/webSocket.js";
import fs from "fs";
import config from "../config/config.js";
import moment from "moment";

export const participantCsv = async (req, res, next) => {
  let room = await getRoom(req.params.tenant_id, req.params.roomid);
  if (room) {
    let header = ["名前", "接続日時", "切断日時", "端末種別", "名前種別"];
    let data = [];

    if (req.query?.date) {
      data = room?.participant_list_history.map((r) => {
        if (moment(r.last_connection).format("YYYYMMDD") == req.query?.date) {
          return {
            名前: r.username,
            接続日時: moment(r.last_connection).format("YYYY/MM/DD HH:mm:ss"),
            切断日時: r.disconnect_date
              ? moment(r.disconnect_date).format("YYYY/MM/DD HH:mm:ss")
              : "-",
            端末種別: r.terminal_type,
            名前種別: r.name_type,
          };
        }
      });

      let pathFolder = `csv`;
      let fileName = `参加者名簿出力`;
      /* create csv file */
      await writecsv(`${fileName}.csv`, pathFolder, header, data);
      res.download(`${pathFolder}/${fileName}.csv`);

      /* remove existing file */
      setTimeout(() => {
        try {
          fs.unlinkSync(`${pathFolder}/${fileName}.csv`);
        } catch (err) {
          console.error(err);
        }
      }, 5000);
    } else {
      res.status(404).send("Please select date");
    }
  } else {
    res.status(404).send("Data not available!");
  }

  return next();
};
