import request from 'supertest';
import app from '../../app.js'
import {redis} from '../../redis/redisClient.js'
import { clearTestData, closeConnections } from './setup.js';
import { batchQueue } from "../../queues/batchQueue.js";
import { config } from '../../config/config.js'
import {channelQueues} from '../../queueService.js'

describe('batching', ()=>{
    beforeEach(async()=>{
        await clearTestData()
    })

    afterAll(async()=>{
        await closeConnections()
    })

    test('two batching requests within a ttl are grouped into one list, one queue job', async()=>{
        const payload = {
            userId: 1, 
            receiverId: 'user_123',
            channel: 'email',
            type: 'post',
            priority: 'batching'

        }

        await request(app)
        .post('/notification')
        .set('Authorization','Bearer key_dev_local_123')
        .set('idempotency-key', '61d3cdf7-16b0-4aa3-a421-cf6ff315a233' )
        .send(payload)


        await request(app)
        .post('/notification')
        .set('Authorization','Bearer key_dev_local_123')
        .set('idempotency-key', '8a5a5533-6c35-480c-9f60-93ba814dce82' )
        .send(payload)

        const listLength = await redis.llen('batch:user_123:email')
        expect (listLength).toBe(2)

    })

    test('returns 400 when all 3 channels are disabled',async()=>{
           const payload = {
            userId: 1, 
            receiverId: 'user_123',
            channel: 'email',
            type: 'post',
            priority: 'batching'

        }
        await request(app)
        .get('/preference/user_123')
        .set('Authorization','Bearer key_dev_local_123')

        const patchres = await request(app)
         .patch('/preference/user_123')
         .set('Authorization','Bearer key_dev_local_123')
         .send({email_enabled:false, sms_enabled: false, websocket_enabled: false})

        const res = await request(app) 
         .post('/notification')
         .set('Authorization', 'Bearer key_dev_local_123')
         .set('idempotency-key','76b719a1-69d0-429a-93c4-49ed215f67ac')
         .send(payload)
        
        const emaillistLength = await redis.llen('batch:user_123:email')
        const websocketlistLength = await redis.llen('batch:user_123:websocket')
        const smslistLength = await redis.llen('batch:user_123:sms')
        expect (emaillistLength).toBe(0)
        expect(websocketlistLength).toBe(0)
        expect(smslistLength).toBe(0)
        expect (patchres.status).toBe(200)
        expect (res.status).toBe(400)
        expect (res.body.message).toBe("Atleast one channel should be enabled")
    })

     test('batches only into the sms list when only sms is enabled',async()=>{
           const payload = {
            userId: 1, 
            receiverId: 'user_123',
            channel: 'email',
            type: 'post',
            priority: 'batching'

        }
        await request(app)
        .get('/preference/user_123')
        .set('Authorization','Bearer key_dev_local_123')

        const patchres = await request(app)
         .patch('/preference/user_123')
         .set('Authorization','Bearer key_dev_local_123')
         .send({email_enabled:false, sms_enabled: true, websocket_enabled: false})

        const res = await request(app) 
         .post('/notification')
         .set('Authorization', 'Bearer key_dev_local_123')
         .set('idempotency-key','8ad5e01f-8aed-4c17-858a-90c84e973f57')
         .send(payload)
        
        const emaillistLength = await redis.llen('batch:user_123:email')
        const websocketlistLength = await redis.llen('batch:user_123:websocket')
        const smslistLength = await redis.llen('batch:user_123:sms')
        expect (emaillistLength).toBe(0)
        expect(websocketlistLength).toBe(0)
        expect(smslistLength).toBe(1)
        expect (patchres.status).toBe(200)
        expect (res.status).toBe(202)
        expect (res.body.message).toBe("Accepted Batch processing started")
    })


    test('check if batch queue is loaded',async()=>{

            const payload = {
            userId: 1, 
            receiverId: 'user_123',
            channel: 'email',
            type: 'post',
            priority: 'batching'

        }
        await request(app)
        .get('/preference/user_123')
        .set('Authorization','Bearer key_dev_local_123')

        const patchres = await request(app)
         .patch('/preference/user_123')
         .set('Authorization','Bearer key_dev_local_123')
         .send({email_enabled:false, sms_enabled: true, websocket_enabled: false})
            
        const res1 = await request(app) 
         .post('/notification')
         .set('Authorization', 'Bearer key_dev_local_123')
         .set('idempotency-key','7fa50f63-eb11-4050-b87a-595b6b3ce7b7')
         .send(payload)

        const res2 = await request(app) 
         .post('/notification')
         .set('Authorization', 'Bearer key_dev_local_123')
         .set('idempotency-key','2be1b2f3-3980-4e30-9559-0a5230d6e287')
         .send(payload)

        const jobs = await batchQueue.getJobs(['delayed'])
        const listLength = await redis.llen('batch:user_123:sms')
        expect (listLength).toBe(2)
        expect (patchres.status).toBe(200)
        expect(res1.status).toBe(202)
        expect (res1.body.message).toBe("Accepted Batch processing started")
        expect(res2.status).toBe(202)
        expect (res2.body.message).toBe("Accepted Batch processing started")
        expect (jobs.length).toBe(1)
        expect(jobs[0]?.data).toEqual({ receiverId: 'user_123', channel: 'sms' })
        expect(jobs[0]?.name).toEqual('process-batch')
        expect(jobs[0]?.opts.delay).toEqual(config.batching.ttl * 1000)
        

    })


    test('check if urgent queue works', async()=>{
            const payload = {
            userId: 1, 
            receiverId: 'user_123',
            channel: 'email',
            type: 'post',
            priority: 'urgent',
            message: "Hello how are you"

        }
         await request(app)
        .get('/preference/user_123')
        .set('Authorization','Bearer key_dev_local_123')

        const patchres = await request(app)
         .patch('/preference/user_123')
         .set('Authorization','Bearer key_dev_local_123')
         .send({email_enabled:false, sms_enabled: true, websocket_enabled: false})

        const res = await request(app) 
         .post('/notification')
         .set('Authorization', 'Bearer key_dev_local_123')
         .set('idempotency-key','7fa50f63-eb11-4050-b87a-595b6b3ce7b7')
         .send(payload)

        const batchjob = await batchQueue.getJobs(['delayed'])
        const smsJobs = await channelQueues.sms.getJobs(['waiting'])
        const emailJobs = await channelQueues.email.getJobs(['waiting'])
        const websocketJobs = await channelQueues.websocket.getJobs(['waiting'])
        
        expect (patchres.status).toBe(200)
        expect(res.status).toBe(201)
        expect (res.body.message).toBe('created Successfully')
        expect(batchjob.length).toBe(0)
        expect(smsJobs.length).toBe(1)
        expect(emailJobs.length).toBe(0)
        expect(websocketJobs.length).toBe(0)
        expect(smsJobs[0]?.data).toEqual(payload)
        expect(smsJobs[0]?.name).toEqual("send sms notification")

    })
})