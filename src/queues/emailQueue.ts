import {Queue, type QueueOptions} from 'bullmq'
import {config} from '../config/config.js'

const emailQueueOptions: QueueOptions= {
    connection:{
        host: config.redis.host,
        port: config.redis.port
    }

}


export const emailQueue = new Queue('emailQueue', emailQueueOptions)