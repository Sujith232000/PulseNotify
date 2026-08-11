import {Queue, type QueueOptions} from 'bullmq'
import {config} from '../config/config.js'

const websocketQueueOptions: QueueOptions= {
    connection:{
        host: config.redis.host,
        port: config.redis.port
    }

}

export const websocketQueue = new Queue('websocketQueue', websocketQueueOptions)