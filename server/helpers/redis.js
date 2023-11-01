import { createClient, createCluster } from 'redis';
import config from '../config/config.js'

console.log('REDIS_CLUSTER', config.env.REDIS_CLUSTER)
let redisClient
if(config.env.REDIS_CLUSTER == 'false'){
    const redisUrl = config.env.REDIS_KEY ? `redis://:${config.env.REDIS_KEY}@${config.env.REDIS_HOST}:${config.env.REDIS_PORT}/${config.env.REDIS_DB}` : `redis://${config.env.REDIS_HOST}:${config.env.REDIS_PORT}/${config.env.REDIS_DB}`
    redisClient = createClient({
        url: redisUrl
    });
} else {
    let rootNodes = [];
    config.env.REDIS_PORT.split(',').map((port)=>{
        rootNodes.push(config.env.REDIS_KEY ? `redis://:${config.env.REDIS_KEY}@${config.env.REDIS_HOST}:${port}/${config.env.REDIS_DB}` : `redis://${config.env.REDIS_HOST}:${port}/${config.env.REDIS_DB}`)
    })
    redisClient = createCluster({
        rootNodes: rootNodes
    });
}

redisClient.on('error', (err) => console.log(`Redis Client Error`, err));


export { redisClient }
