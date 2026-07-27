import { Queue,type QueueOptions} from "bullmq";
import {config} from '../config/config.js'
const queueoptions: QueueOptions = {
    connection:{
        host: config.redis.host,
        port: config.redis.port
    }, defaultJobOptions:{
        attempts: config.retry.attempts,
        backoff: {
            type: "exponential",
            delay: config.retry.backoffdelay
        }
        
    }
}
export const notificationQueue = new Queue('notification', queueoptions)