import {redis} from '../../redis/redisClient.js'
import {PrismaClient} from '../../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import { batchQueue } from '../../queues/batchQueue.js'
import { channelQueues } from '../../queueService.js'
import { prisma } from '../../prismaClient.js'

export async function clearTestData(){
    await prisma.receiverPreference.deleteMany()
    await redis.flushdb()
}

export async function closeConnections() {
  await prisma.$disconnect()
  await redis.quit()
  await batchQueue.close()
  await channelQueues.sms.close()
  await channelQueues.email.close()
  await channelQueues.websocket.close()

}