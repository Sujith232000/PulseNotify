import {Queue, type QueueOptions} from 'bullmq'
import {config} from '../config/config.js'

const batchQueueOptions: QueueOptions = {
    connection:{
        host: config.redis.host,
        port: config.redis.port
    }

}

export const batchQueue = new Queue('batchQueue', batchQueueOptions)