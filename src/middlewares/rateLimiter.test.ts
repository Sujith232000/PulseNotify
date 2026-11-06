import { jest, test, expect, beforeAll } from '@jest/globals';

jest.unstable_mockModule('../redis/redisClient.js', () => ({
  redis: {
    rateLimitCheck: jest.fn(),
  },
}));

let redis: any;
let rateLimiter: any;

beforeAll(async () => {
  ({ redis } = await import('../redis/redisClient.js'));
  ({ rateLimiter } = await import('./rateLimiter.js'));
});

test('return 401 when no token is present', async()=>{
    const mockeReq = {} as any
    const mockRes = {status:jest.fn().mockReturnThis(), json:jest.fn()} as any;
    const mockNext = jest.fn()

    await rateLimiter(mockeReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled()
});

test('returns 429 when not allowed', async()=>{
    (redis.rateLimitCheck as jest.Mock<() => Promise<number>>).mockResolvedValue(0);
    const mockReq = {token:'abc123'} as any
    const mockRes = {status: jest.fn().mockReturnThis(), json:jest.fn()} as any 
    const mockNext = jest.fn()

    await rateLimiter(mockReq,mockRes,mockNext)
    
    expect(mockRes.status).toHaveBeenCalledWith(429)
    expect(mockNext).not.toHaveBeenCalled()
})

test('returns nothing when allowed is 1', async()=>{
    (redis.rateLimitCheck as jest.Mock<() => Promise<number>>).mockResolvedValue(1);
    const mockReq = {token:'abc123'} as any
    const mockRes = {status: jest.fn().mockReturnThis(), json: jest.fn()} as any
    const mockNext = jest.fn()

    await rateLimiter(mockReq,mockRes, mockNext)

    expect(mockRes.status).not.toHaveBeenCalled()
    expect(mockNext).toHaveBeenCalled()
})