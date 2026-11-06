import {Queue, type QueueOptions} from 'bullmq'
import { config } from '../config/config.js'

const dlqqueueoptions: QueueOptions = {
    connection:{
        host: config.redis.host,
        port: config.redis.port
    }
}

export const dlq = new Queue('notificationdlq', dlqqueueoptions)
