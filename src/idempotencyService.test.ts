import { jest, test, expect, beforeAll } from '@jest/globals';

jest.unstable_mockModule('./redis/redisClient.js', () => ({
  redis: {
    set: jest.fn(),
  },
}));

let redis: any;
let isDuplicate: any

beforeAll(async () => {
  ({ redis } = await import('./redis/redisClient.js'));
  ({ isDuplicate } = await import('./idempotencyService.js'));
});

test('returns false when key is not present (OK)', async()=>{
      redis.set.mockResolvedValue('OK')
      const result = await isDuplicate('some-key', 3600);
      expect(result).toBe(false)

})

test('returns true when key is present (null)', async()=>{
      redis.set.mockResolvedValue(null)
      const result = await isDuplicate('some-key', 3600);
      expect(result).toBe(true)

})