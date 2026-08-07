import {Redis} from 'ioredis';
import {config} from '../config/config.js'


export const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port
})