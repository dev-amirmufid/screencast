import winston from "winston";
import "winston-daily-rotate-file";

const { createLogger, transports, format } = winston;
const logDir = "logs/web";
const logDirApp = "logs/app";

const customFormat = format.combine(
  format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss.sss",
  }),
  format.printf((info) => {
    return `${info.timestamp} - [${info.level.toUpperCase().padEnd(7)}] - ${
      info.message
    }`;
  })
);

const transport = (level, dir, filename) =>
  new transports.DailyRotateFile({
    dirname: dir,
    filename: `%DATE%-${filename}.log`,
    maxSize: "1g",
    maxFiles: "29d",
    zippedArchive: true,
    datePattern: "YYYY-MM-DD",
    level: level,
  });

/* logger for web */
export const logger = createLogger({
  format: customFormat,
  transports: [transport("info", logDir, "WEB"), transport("error", logDir, "WEB")],
});

/* logger for app */
export const loggerApp = createLogger({
  format: customFormat,
  transports: [transport("info", logDirApp, 'APPLI'), transport("error", logDirApp, 'APPLI')],
});