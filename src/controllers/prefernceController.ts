import type {Request, Response} from 'express'
import { updatePreferenceSchema } from '../validation/updatePreferenceSchema.js'
import {PrismaClient} from '../generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import {redis} from '../redis/redisClient.js'
import { getReceiverPreferences } from '../preference_Service.js'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({adapter})

export const updatePreferences = (async(req:Request, res:Response)=>{
    const receiverId = req.params.receiverId
    const update = updatePreferenceSchema.safeParse(req.body)
    let validatedUpdate;
    let cleanedUpdate;
    if(update.success){
        validatedUpdate = update.data
        cleanedUpdate = Object.fromEntries(
        Object.entries(validatedUpdate).filter(([_, v]) => v !== undefined)
        );
    }
    else{
        return res.status(400).json({message: "wrong data provided"})
    }
    const updatedRow = await prisma.receiverPreference.update({
        where:{receiver_id:receiverId as string},
        data: cleanedUpdate 
    })
    await redis.del(`preference:${receiverId}`)
    return res.status(200).json({message:'row updated successfully', updatedRow})

})

export const getpreferences = (async(req:Request, res:Response)=>{
    const receiverId = req.params.receiverId
    if (receiverId && typeof receiverId === 'string') {
          const preference = await getReceiverPreferences(receiverId)  
       if(preference === null){
        return res.status(404).json({message:`${receiverId} not found`})
    }
    return res.status(200).json({message: "row fetched successfully",preference})
}else{
     return res.status(400).json({message: "invalid receiverId"})
}  
})