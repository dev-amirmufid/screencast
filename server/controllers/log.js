import { logger, loggerApp } from "../logger.js";

export const storeLog = async (req, res, next) => {
  const body = req.body;

  if (body?.status == "error") {
    logger.error(`${body.action} - ${body?.data.toString()}`);
  } else {
    logger.info(`${body.action} - ${body?.data.toString()}`);
  }
  res.status(200).json({ msg: "log created" });
  return next()
    
};

/* create log for appli */

export const createLog = async (req, res, next) => {
  const body = req.body;

  if (body?.level) {
    if (body?.level != 4) {
      loggerApp.info(`[${timeConverter(body.time)}],[${body.username} (${body.user_id})],[${body.tag}],${body?.data},${body?.room_id},${body?.room_name},${body?.device_name},${body?.os_version}`);
    } else {
      loggerApp.error(`[${timeConverter(body.time)}],[${body.username} (${body.user_id})],[${body.tag}],${body?.data},${body?.room_id},${body?.room_name},${body?.device_name},${body?.os_version}`);
    }
    res.status(200).send({status: "success", message: "log successfully created"});
  } else {
    res.status(400).json({ status: "failed", message: "invalid log level" });
  }
  return next()
    
};

function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var milsec = a.getMilliseconds();
  var time = year + '/' + month + '/' + date + ' ' + hour + ':' + min + ':' + sec + '.' + milsec ;
  return time;
}
