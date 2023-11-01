import dotenv from 'dotenv'
import { genSaltSync } from 'bcrypt';
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV.trim()}` : '.env'
dotenv.config({
 path: envFile
});

const BASE_URL = `${process.env.USE_HTTPS == 'true' ? 'https':'http'}://${process.env.HOST}${process.env.PORT == '' ? '':`:${process.env.PORT}`}`

let config = {
  BASE_URL: BASE_URL,
  salt : genSaltSync(10),
  timeoutScreen: 30000, //30 second
  teacherTimeout: 600000,
  CRYPTO_KEY_STUDENT: "RNgUw9uXCPAnQwdDhPVn",
  CRYPTO_KEY_ASSISTANT: "Iw49aET55fUqKDbkDXdH",
  INITIAL_SCREEN: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXwAAAEECAIAAACk9BgxAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAE2SURBVHhe7cEBDQAAAMKg909tDwcEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMCpGocQAAGHtynIAAAAAElFTkSuQmCC",
  JOB_LOCK_DURATION_TIME : 60000,
  JOB_LOCK_RENEW_TIME : 30000,
  JOB_STALED_CHECK_INTERVAL : 10000,
  JOB_MAX_CONCURENCY : 2,
  env : {}
}
for (const property in process.env) {
  config.env[property] = process.env[property]
}

export default config
