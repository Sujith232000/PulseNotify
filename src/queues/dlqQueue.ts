import {Queue, type QueueOptions} from 'bullmq'

const dlqqueueoptions: QueueOptions = {
    connection:{
        host: 'localhost',
        port: 6379
    }
}

export const dlq = new Queue('notificationdlq', dlqqueueoptions)
