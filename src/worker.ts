import {Worker, type WorkerOptions} from 'bullmq'
import {dlq} from './queues/dlqQueue.js'
import {config} from './config/config.js'
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

