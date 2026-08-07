import { batchQueue } from "./queues/batchQueue.js";
import {redis} from './redis/redisClient.js'
import { notificationSchema } from "./validation/notificationSchema.js";
import{config} from './config/config.js'
import {z} from 'zod'

type NotificationInput = z.infer<typeof notificationSchema>

export async function checkBatching(notification:NotificationInput): Promise<void>{
    const flagCreated = await redis.set(`batch-window:${notification.receiverId}`,"1",'EX', config.batching.ttl, 'NX' )// only set this key if it did not exist
    console.log('flagCreated result:', flagCreated)
    await redis.rpush(`batch:${notification.receiverId}`, JSON.stringify(notification))
    console.log('rpush done')
    if(flagCreated === 'OK'){ //key was not there i just created it 
       await batchQueue.add('process-batch',{receiverId: notification.receiverId}, {delay:config.batching.ttl*1000})
    }

}
