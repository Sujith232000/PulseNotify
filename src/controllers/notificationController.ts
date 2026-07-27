import type {Request, Response} from 'express'
import {notificationSchema} from '../validation/notificationSchema.js'
import {notificationQueue} from '../queues/notificationQueue.js'

export const sendNotification = (async(req: Request, res: Response)=>{
    const validatedPayload = notificationSchema.safeParse(req.body) // safeparse gives out two things when validation passes it gives (success:true, data) when it fails it gives (success:false, error)
    if (validatedPayload.success){
        req.body = validatedPayload.data 
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
    await notificationQueue.add('send notification', req.body)
    res.status(201).json({message:'created Successfully'})
})

