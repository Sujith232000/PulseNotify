-- KEYS[1] = rate limit key, e.g. "ratelimit:key_dev_local_123"
-- ARGV[1] = capacity (e.g. 100)
-- ARGV[2] = refillRate (tokens per second, e.g. 1.67)
-- ARGV[3] = now (current timestamp in seconds)
local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refillRate = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local bucket = redis.call('HMGET', key, 'tokens', 'lastRefill')
local tokens = tonumber(bucket[1])
local lastRefill = tonumber(bucket[2])

if tokens == nil then 
    tokens = capacity 
    lastRefill = now
end

local elapsed = now - lastRefill
local tokensAccumulated = elapsed * refillRate
local currentTokens = math.min(capacity, tokens + tokensAccumulated)

local allowed = 0 
if currentTokens >= 1 then 
    allowed = 1
    currentTokens = currentTokens - 1
end 

redis.call('HMSET', key, 'tokens', currentTokens, 'lastRefill', now)
redis.call('EXPIRE', key, 3600)

return allowed