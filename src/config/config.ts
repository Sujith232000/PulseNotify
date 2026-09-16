import dotenv from 'dotenv'
dotenv.config({ quiet: true })

function getStringEnv(varName:string): string {
    if(process.env[varName]===undefined){
        throw new Error(`${varName} is undefined`)
    }
    return process.env[varName]
}

function getNumberEnv(varName: string): number {
    return parseInt(getStringEnv(varName),10)
}

export const config = {
    redis: {
        host: getStringEnv('REDIS_HOST'),
        port: getNumberEnv('REDIS_PORT')
    },

    retry:{
        attempts: getNumberEnv('QUEUE_RETRY_ATTEMPTS'),
        backoffdelay: getNumberEnv('QUEUE_BACKOFF_DELAY')
    },
    server:{
        port: getNumberEnv('SERVER_PORT')
    },
    worker:{
        concurrency: getNumberEnv('CONCURRENCY')
    },
    idempotency:{
        ttl: getNumberEnv('IDEMPOTENCY_TTL_SECONDS')
    },
    batching:{
        ttl: getNumberEnv('BATCHING_TTL_SECONDS')
    },
    preference:{
        ttl: getNumberEnv('PREFERENCE_TTL_SECONDS')
    }
}

