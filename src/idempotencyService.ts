import {redis} from './redis/redisClient.js'

export async function isDuplicate(key:string, ttl:number): Promise<boolean>{
    const redisReturn = await redis.set(key,"1","EX",ttl,"NX")
    if (redisReturn === "OK"){
        return false;
    }
    else {
        return true;
    }
}
