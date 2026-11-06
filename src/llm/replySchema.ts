import {z} from 'zod';
import {config} from '../config/config.js'

export const replySchema = z.string().trim().min(1).max(config.llm.max_reply_chars)

export function validateReply(raw:string):string{
    return replySchema.parse(raw)
}