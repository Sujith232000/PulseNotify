import {Worker, Job, type WorkerOptions} from 'bullmq'
import {dlq} from './queues/dlqQueue.js'
import {config} from './config/config.js'
import {redis} from './redis/redisClient.js'
import { channelQueues } from './queueService.js'
import { notificationSchema } from './validation/notificationSchema.js'

const workeroptions: WorkerOptions = {
    connection: {
        host: config.redis.host,
        port: config.redis.port
    }, concurrency: config.worker.concurrency
}

type BatchJobData = {
  receiverId: number,
  channel: 'email' | 'sms' | 'websocket'
}

const emailWorker = new Worker('emailQueue', async(job)=>{
    console.log('email job picked up', job.id, job.name, job.data)
}, workeroptions)

const smsWorker = new Worker('smsQueue', async(job)=>{
    console.log('sms job picked up', job.id, job.name, job.data)
}, workeroptions)

const websocketWorker = new Worker('websocketQueue', async(job)=>{
    console.log('websocket job picked up', job.id, job.name, job.data)
}, workeroptions)

async function handlejobFailure(job:Job| undefined, err:Error, prev: string):Promise<void>{
        console.log('job failed', job?.id, 'attempt', job?.attemptsMade, err.message)
    if (job?.attemptsMade === job?.opts.attempts){
        console.log('pushing to DLQ', job?.id)
        await dlq.add('dead letter', {
            originaljobid: job?.id,
            originaljobname: job?.name,
            payload: job?.data,
            attemptsmade: job?.attemptsMade,
            failurereason: err.message

        })
        
    }
}



const batchWorker = new Worker<BatchJobData>('batchQueue',async(job)=>{
    const receiverId = job.data.receiverId
    const channel = job.data.channel
    const redisList = await redis.lrange(`batch:${receiverId}:${channel}`,0,-1)
    if(redisList.length === 0){
        throw new Error('list should not be empty atleast one notification should be there')
    }
    const parsed = redisList.map((str)=> {
        const par = JSON.parse(str)
        const validatedParsed = notificationSchema.safeParse(par)
        if (validatedParsed.success){
            return validatedParsed.data
        }else{
            throw new Error("Invalid notification data in batch queue")
        }
    })
    const counts: Record<string, number> = {}
    for (const notification of parsed){
        counts[notification.type] = (counts[notification.type] || 0) + 1
    }
    const parts: string[] = []
    const entries = Object.entries(counts)
    for (const[key, value] of entries){
        parts.push(`${value} ${key}`)
    }
    const summmary = parts.join(',')
    const finalMessage = (`you have ${summmary}`)
    channelQueues[channel].add('Send_Summary_Notification', {receiverId:receiverId, message: finalMessage, channel: channel})
    await redis.del(`batch:${receiverId}:${channel}`)
}, workeroptions)

batchWorker.on('completed', async(job, result: void)=> {
    console.log('job is completed', job.data)
})

emailWorker.on('failed', handlejobFailure)

smsWorker.on('failed', handlejobFailure)

websocketWorker.on('failed', handlejobFailure)



 