import request from 'supertest'
import app from '../../app.js'
import { batchQueue } from "../../queues/batchQueue.js";
import { clearTestData, closeConnections } from './setup.js';
import {redis} from '../../redis/redisClient.js'
import { randomUUID } from 'crypto'

describe('idempotency', ()=>{
    const payload = {
    userId: 1,
    receiverId: 'user_123',
    channel: 'email',
    type: 'post',
    priority: 'batching'
}

    beforeEach(async()=>{
        await clearTestData()
    })

    afterAll(async()=>{
        await closeConnections()
    })

test('rejecting duplicate requests', async()=>{

    const res1 = await request(app)
    .post('/notification')
    .set('Authorization','Bearer key_dev_local_123')
    .set('idempotency-key','fd9e7bb6-d506-4967-a2b8-ff97ac34e56a')
    .send(payload)


    const res2 = await request(app)
    .post('/notification')
    .set('Authorization','Bearer key_dev_local_123')
    .set('idempotency-key','fd9e7bb6-d506-4967-a2b8-ff97ac34e56a')
    .send(payload)
    
    const jobs = await batchQueue.getJobs(['delayed'])
    const listLength = await redis.llen('batch:user_123:email')

    expect(res1.status).toBe(202)
    expect(res1.body.message).toBe('Accepted Batch processing started')
    expect (jobs.length).toBe(1)
    expect(res2.status).toBe(409)
    expect(res2.body.message).toBe('Duplicate request: this notification has already been processed')
    expect (listLength).toBe(1)
})

    test('rejects a request with no idempotency key', async () => {
    const res = await request(app)
        .post('/notification')
        .set('Authorization', 'Bearer key_dev_local_123')
        .send(payload)

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('idempotency key header is missing')
})

test('rejects a malformed idempotency key', async () => {
    const res = await request(app)
        .post('/notification')
        .set('Authorization', 'Bearer key_dev_local_123')
        .set('idempotency-key', 'not-a-uuid')
        .send(payload)

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('idempotency key header must be a valid UUID')
})

test('accepts two requests with different keys', async () => {
    const res1 = await request(app)
        .post('/notification')
        .set('Authorization', 'Bearer key_dev_local_123')
        .set('idempotency-key', randomUUID())
        .send(payload)

    const res2 = await request(app)
        .post('/notification')
        .set('Authorization', 'Bearer key_dev_local_123')
        .set('idempotency-key', randomUUID())
        .send(payload)

    const listLength = await redis.llen('batch:user_123:email')

    expect(res1.status).toBe(202)
    expect(res2.status).toBe(202)
    expect(listLength).toBe(2)
})

})
