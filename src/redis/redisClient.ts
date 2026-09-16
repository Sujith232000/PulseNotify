import path from 'path';
import fs from 'fs';
import {Redis} from 'ioredis';
import {config} from '../config/config.js'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)



export const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port
})
const rateLimitScript = fs.readFileSync(
   path.join(__dirname, '../scripts/rateLimit.lua'),
  'utf-8'
)

redis.defineCommand('rateLimitCheck', {
  numberOfKeys: 1,
  lua: rateLimitScript
})