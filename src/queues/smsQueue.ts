import {Queue, type QueueOptions} from 'bullmq'
import {config} from '../config/config.js'

const smsQueueOptions: QueueOptions= {
    connection:{
        host: config.redis.host,
        port: config.redis.port
    }

}


export const smsQueue = new Queue('smsQueue', smsQueueOptions)