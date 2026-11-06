import { jest, test, expect, beforeAll, beforeEach } from '@jest/globals';

const mockFindUnique: any = jest.fn();
const mockCreate: any = jest.fn();

class MockPrismaClient{
    receiverPreference = {
        findUnique: mockFindUnique,
        create: mockCreate
    }
}

class MockPrismaClientKnownRequestError extends Error{
    code: string;
    constructor(message:string, code:string){
        super(message);
        this.code = code
    }
}

jest.unstable_mockModule('./generated/prisma/client.js', () => ({
  PrismaClient: MockPrismaClient,
  Prisma: {
    PrismaClientKnownRequestError: MockPrismaClientKnownRequestError,
  },
}));

jest.unstable_mockModule('@prisma/adapter-pg', () => ({
  PrismaPg: class {},
}));

jest.unstable_mockModule('./redis/redisClient.js', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

let redis: any;
let getReceiverPreferences: any;

beforeAll(async () => {
  ({ redis } = await import('./redis/redisClient.js'));
  ({ getReceiverPreferences } = await import('./preference_Service.js'));
});

beforeEach(() => {
  jest.clearAllMocks();
});
const fakeReceiverId = 'r1';
const fakeRow = {
  id: 1,
  receiver_id: 'r1',
  email_enabled: true,
  sms_enabled: false,
  websocket_enabled: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

test ("1. cache hit, valid returns parsed data", async()=>{
  redis.get.mockResolvedValue(JSON.stringify(fakeRow))
  const result = await getReceiverPreferences(fakeReceiverId);
  expect(result.receiver_id).toBe('r1');
})

test('2. cache hit, invalid/corrupted → returns null', async () => {
  redis.get.mockResolvedValue(JSON.stringify({ garbage: 'not a real shape' }));
  const result = await getReceiverPreferences(fakeReceiverId);
  expect(result).toBeNull();
});

test ("3 cache miss and row found in db", async()=>{
    redis.get.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue(fakeRow);
    const result = await getReceiverPreferences(fakeReceiverId);
    expect (redis.set).toHaveBeenCalled()
    expect(result.receiver_id).toBe(fakeReceiverId)
})

test("4. no db row create succeeds and returns a new row", async()=>{
  redis.get.mockResolvedValue(null)
  mockFindUnique.mockResolvedValue(null)
  mockCreate.mockResolvedValue(fakeRow)
  const result = await getReceiverPreferences(fakeReceiverId)
  expect(result.receiver_id).toBe(fakeReceiverId)
})

test ("5. cache miss no DB row and create fails with p2002 catch it and return existing row", async()=>{
    redis.get.mockResolvedValue(null)
    mockFindUnique.mockResolvedValueOnce(null)
    mockFindUnique.mockResolvedValueOnce(fakeRow)
    mockCreate.mockRejectedValue(new MockPrismaClientKnownRequestError('duplicate', 'P2002'))
    const result = await getReceiverPreferences(fakeReceiverId)
    expect(mockFindUnique).toHaveBeenCalledTimes(2);
    expect(result.receiver_id).toBe(fakeReceiverId)
})


test("6. cacheMiss no DB row, create fails with some other error, rethrow", async()=>{
    redis.get.mockResolvedValue(null)
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockRejectedValue(new Error('something else went wrong'));
    await expect(getReceiverPreferences(fakeReceiverId)).rejects.toThrow('something else went wrong');

})