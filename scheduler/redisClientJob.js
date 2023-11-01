import { createClient } from 'redis';
import config from './config/config.js'

const redisUrl = config.REDIS_KEY ? `redis://:${config.REDIS_KEY}@${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB_JOB}` : `redis://${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB_JOB}`

const redisClientJob = createClient({
    url: redisUrl
});

redisClientJob.on('error', (err) => console.log('Redis Client Error', err));

await redisClientJob.connect();


export default redisClientJob