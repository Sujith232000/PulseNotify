import {Worker, type WorkerOptions} from 'bullmq'
import {dlq} from './queues/dlqQueue.js'
import {config} from './config/config.js'
import { batchQueue } from './queues/batchQueue.js'
import {redis} from './redis/redisClient.js'
import { json, object } from 'zod'
import { notificationQueue } from './queues/notificationQueue.js'

const workeroptions: WorkerOptions = {
    connection: {
        host: config.redis.host,
        port: config.redis.port
    }, concurrency: config.worker.concurrency
}

const worker = new Worker('notification', async(job)=>{
    console.log('started', job.id, job.name, job.data, Date.now())
    await new Promise<void>((resolve)=>{
        setTimeout(()=>{
            resolve()
        },3000)
    })
    throw new Error('Simulated API failure ')

},workeroptions)


const batchWorker = new Worker('batchQueue',async(job)=>{
    const receiverId = job.data.receiverId
    const redisList = await redis.lrange(`batch:${receiverId}`,0,-1)
    const parsed = redisList.map((str)=> JSON.parse(str))
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
    notificationQueue.add('Send_Summary_Notification', {receiverId: parsed[0].receiverId, message: finalMessage, channel: parsed[0].channel})
    await redis.del(`batch:${receiverId}`)
}, workeroptions)

batchWorker.on('completed', async(job, result: void)=> {
    console.log('job is completed', job.data)
})

worker.on('failed',async(job, err)=>{
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
})

