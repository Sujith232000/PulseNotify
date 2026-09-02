import type {Request, Response} from 'express'
import {notificationSchema} from '../validation/notificationSchema.js'
import { idempotencyKeySchema } from '../validation/idempotencyKeySchema.js'
import {isDuplicate} from '../idempotencyService.js'
import {config} from '../config/config.js'
import { checkBatching } from '../batchingService.js'
import {channelQueues} from '../queueService.js'
import { getReceiverPreferences } from '../preference_Service.js'
import { email } from 'zod'

export const sendNotification = (async(req: Request, res: Response)=>{
    const validatedPayload = notificationSchema.safeParse(req.body) // safeparse gives out two things when validation passes it gives (success:true, data) when it fails it gives (success:false, error)
    let validatedNotification 
    if (validatedPayload.success){
        validatedNotification = validatedPayload.data 
    }
    else{
        /**
         * Shape of validatedPayload.error when safeParse fails:
         * {
         *   success: false,
         *   error: {
         *     issues: [
         *       { code: "invalid_value", path: ["channel"], message: "..." },
         *       { code: "too_small",     path: ["message"], message: "..." }
         *     ]
         *   }
         * }
         * issues is an ARRAY (one entry per broken field, could be 1 or many) —
         * that's why we map() over it instead of accessing a single .path/.message
         * directly. path is itself an array too (supports nested fields), so
         * path[0] pulls out the actual field name since our schema is flat.
         */
        const validationPayloadErrors = validatedPayload.error.issues.map((issue) => {
            return({field:issue.path[0], message:issue.message})
        })
        return res.status(400).json({errors: validationPayloadErrors})
    }
    const idempotencyKey = req.headers['idempotency-key']
    const validatedKey = idempotencyKeySchema.safeParse(idempotencyKey)
    if (validatedKey.success){
        const duplicate = await isDuplicate(validatedKey.data, config.idempotency.ttl)
        if (duplicate){
        return res.status(409).json({message:'Duplicate request: this notification has already been processed'})
        }
    }
    else{
        if (!idempotencyKey){
            return res.status(400).json({message: 'idempotency key header is missing'})
        }
        else{
            return res.status(400).json({message: "idempotency key header must be a valid UUID"})
        }
    }

    const prefs = await getReceiverPreferences(validatedNotification.receiverId)
    if(validatedNotification.priority === 'urgent'){
        
        if (prefs?.email_enabled){
            channelQueues.email.add("send email notification", validatedNotification)
        }
        if (prefs?.sms_enabled){
            channelQueues.sms.add("send sms notification", validatedNotification)
        }
        if(prefs?.websocket_enabled){
            channelQueues.websocket.add("open webcsocket" ,validatedNotification)
        }
        res.status(201).json({message:'created Successfully'})
    }
    else{
        let isChannelEnabled = false
        if(prefs?.email_enabled){
            await checkBatching({...validatedNotification, channel:"email"})
            isChannelEnabled = true
        }
        if(prefs?.sms_enabled){
            await checkBatching({...validatedNotification, channel:"sms"})
            isChannelEnabled = true
        }
        if(prefs?.websocket_enabled){
            await checkBatching({...validatedNotification, channel:"websocket"})
            isChannelEnabled = true
        }
        if(isChannelEnabled === false){
            return res.status(400).json({message:"Atleast one channel should be enabled"})
        }

    res.status(202).json({message:"Accepted Batch processing started"})
    }
})

