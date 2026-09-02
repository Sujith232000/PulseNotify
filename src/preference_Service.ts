import {redis} from './redis/redisClient.js'
import {PrismaClient, Prisma} from './generated/prisma/client.js'
import {type ReceiverPreferenceModel} from './generated/prisma/models/ReceiverPreference.js'
import { PrismaPg } from '@prisma/adapter-pg'
import{config} from './config/config.js'
import {preferenceSchema} from './validation/notificationSchema.js'


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({adapter})

export async function getReceiverPreferences(receiverId:string):Promise<ReceiverPreferenceModel|null>{
    const cached = await redis.get(`preference:${receiverId}`)
    if(cached === null ){
        console.log('cache miss checking db')
        const checkdb = await prisma.receiverPreference.findUnique({
            where:{receiver_id:receiverId}
        })
        if (checkdb === null){
            try{
            const createrow = await prisma.receiverPreference.create({
                data:{receiver_id: receiverId}
            })
            console.log('created new preference row')
            return createrow
            
        } catch (err){
            if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'){
                console.log('duplicate create caught, returning existing row')
                return await prisma.receiverPreference.findUnique({
                    where:{receiver_id: receiverId}
                })
            }
            throw err;
        }
        
        
    }
        else{
            console.log('found in db so info coming from db')
            await redis.set(`preference:${receiverId}`, JSON.stringify(checkdb),"EX",config.preference.ttl)
            return checkdb
        }
    }
    else{
        console.log('cache hit for prefernce getting info from redis')
        const parsed = preferenceSchema.safeParse(JSON.parse(cached))
        if(parsed.success){
            return parsed.data
        }
        else{
            return null
        }

    }

}