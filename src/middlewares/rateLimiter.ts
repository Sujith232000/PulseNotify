import type {Request, Response, NextFunction} from 'express'
import {redis} from '../redis/redisClient.js'

const CAPACITY = 100 
const REFILLRATE = 100/60

export async function rateLimiter(req:Request, res:Response, next: NextFunction){
    const token = req.token
    if(!token){
        return res.status(401).json({ message: "No token found for rate limiting" })
    }

    const key = `rateLimit${token}`
    const now = Date.now()/1000

    const allowed = await redis.rateLimitCheck(key, CAPACITY, REFILLRATE, now)

    if (allowed == 1) {
        next()
    }else{
        return res.status(429).json({ message: "Too many requests, please try again later" })
    }
}