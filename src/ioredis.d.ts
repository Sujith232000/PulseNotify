import 'ioredis'

declare module 'ioredis' {
    interface RedisCommander <Context>{
        rateLimitCheck (key: string, capacity: number, refillRate: number, now: number):Promise<number>
    }
}