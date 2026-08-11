import { batchQueue } from "./queues/batchQueue.js";
import {redis} from './redis/redisClient.js'
import { notificationSchema } from "./validation/notificationSchema.js";
import{config} from './config/config.js'
import {z} from 'zod'

type NotificationInput = z.infer<typeof notificationSchema>

export async function checkBatching(notification:NotificationInput): Promise<void>{
    const flagCreated = await redis.set(`batch-window:${notification.receiverId}:${notification.channel}`,"1",'EX', config.batching.ttl, 'NX' )// only set this key if it did not exist
    await redis.rpush(`batch:${notification.receiverId}:${notification.channel}`, JSON.stringify(notification))
    if(flagCreated === 'OK'){ //key was not there i just created it 
       await batchQueue.add('process-batch',{receiverId: notification.receiverId,channel: notification.channel}, {delay:config.batching.ttl*1000})
    }

}
