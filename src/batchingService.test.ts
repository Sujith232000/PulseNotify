import { jest, test, expect, beforeAll, beforeEach } from '@jest/globals';

beforeEach(() => {
  jest.clearAllMocks();
});

jest.unstable_mockModule('./redis/redisClient.js', () => ({
  redis: {
    set: jest.fn(),
    rpush: jest.fn()
  }
}));


jest.unstable_mockModule("./queues/batchQueue.js", () => ({
  batchQueue: {
    add: jest.fn()
  }
}));

let redis: any 
let batchQueue: any 
let checkBatching: any 

beforeAll(async()=>{
    ({redis} = await import('./redis/redisClient.js'));
    ({batchQueue} = await import("./queues/batchQueue.js"));
    ({ checkBatching } = await import('./batchingService.js'));
})

test('returns ok key is not present', async()=>{
      const notification = { receiverId: 'r1', channel: 'email' } as any;      
      redis.set.mockResolvedValue('OK');
      redis.rpush.mockResolvedValue(1);
      batchQueue.add.mockResolvedValue(undefined)

      await checkBatching(notification)

      expect(batchQueue.add).toHaveBeenCalled()
})


test('returns null when key is present', async()=>{
      const notification = { receiverId: 'r1', channel: 'email' } as any;      
      redis.set.mockResolvedValue(null);
      redis.rpush.mockResolvedValue(1);
      batchQueue.add.mockResolvedValue(undefined)

      await checkBatching(notification)

      expect(batchQueue.add).not.toHaveBeenCalled()
})


