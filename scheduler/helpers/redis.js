import { createClient, createCluster } from 'redis';
import config from '../config/config.js'

console.log('REDIS_CLUSTER', config.REDIS_CLUSTER)
let redisClient
if(config.REDIS_CLUSTER == 'false'){
    const redisUrl = config.REDIS_KEY ? `redis://:${config.REDIS_KEY}@${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB}` : `redis://${config.REDIS_HOST}:${config.REDIS_PORT}/${config.REDIS_DB}`
    redisClient = createClient({
        url: redisUrl
    });
} else {
    let rootNodes = [];
    config.REDIS_PORT.split(',').map((port)=>{
        rootNodes.push(config.REDIS_KEY ? `redis://:${config.REDIS_KEY}@${config.REDIS_HOST}:${port}/${config.REDIS_DB}` : `redis://${config.REDIS_HOST}:${port}/${config.REDIS_DB}`)
    })
    redisClient = createCluster({
        rootNodes: rootNodes
    });
}

redisClient.on('error', (err) => console.log(`Redis Client Error`, err));


export { redisClient }
