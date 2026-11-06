import request from 'supertest'
import app from '../../app.js'
import { prisma } from '../../prismaClient.js'
import { redis } from '../../redis/redisClient.js'
import { clearTestData, closeConnections } from './setup.js'
 
const PREF_URL = (id: string) => `/preference/${id}`
const AUTH = 'Bearer key_dev_local_123'
const cacheKey = (id: string) => `preference:${id}`
 
describe('preference service', () => {
    beforeEach(async () => {
        await clearTestData()
    })
 
    afterAll(async () => {
        await closeConnections()
    })
 
    // 1. cache miss, no row
    test('cache miss, no row: creates a default row in Postgres and does not cache it', async () => {
        const res = await request(app).get(PREF_URL('user_new')).set('Authorization', AUTH)
 
        const row = await prisma.receiverPreference.findUnique({ where: { receiver_id: 'user_new' } })
 
        expect(res.status).toBe(200)
        expect(res.body.preference.email_enabled).toBe(true)
        expect(res.body.preference.sms_enabled).toBe(false)
        expect(res.body.preference.websocket_enabled).toBe(false)
        expect(row).not.toBeNull()
        expect(await redis.get(cacheKey('user_new'))).toBeNull()
    })
 
    // 2. cache miss, row exists
    test('cache miss, row exists: reads Postgres and caches with a TTL', async () => {
        await prisma.receiverPreference.create({ data: { receiver_id: 'user_db', sms_enabled: true } })
 
        const res = await request(app).get(PREF_URL('user_db')).set('Authorization', AUTH)
 
        expect(res.status).toBe(200)
        expect(res.body.preference.sms_enabled).toBe(true)
        expect(await redis.get(cacheKey('user_db'))).not.toBeNull()
        expect(await redis.ttl(cacheKey('user_db'))).toBeGreaterThan(0)
    })
 
    // 3. cache hit
    test('cache hit: second GET is served from Redis, not Postgres', async () => {
        await prisma.receiverPreference.create({ data: { receiver_id: 'user_hit' } })
        await request(app).get(PREF_URL('user_hit')).set('Authorization', AUTH)
 
        await prisma.receiverPreference.update({
            where: { receiver_id: 'user_hit' },
            data: { sms_enabled: true },
        })
 
        const res = await request(app).get(PREF_URL('user_hit')).set('Authorization', AUTH)
 
        expect(res.status).toBe(200)
        expect(res.body.preference.sms_enabled).toBe(false)
    })
 
    // 4. race condition
    test('race: many simultaneous GETs for a new receiver all succeed and create exactly one row', async () => {
        const requests = []
        for (let i = 0; i < 20; i++) {
            requests.push(request(app).get(PREF_URL('user_race')).set('Authorization', AUTH))
        }
        const responses = await Promise.all(requests)
 
        const rowCount = await prisma.receiverPreference.count({ where: { receiver_id: 'user_race' } })
 
        for (const res of responses) {
            expect(res.status).toBe(200)
            expect(res.body.preference.receiver_id).toBe('user_race')
        }
        expect(rowCount).toBe(1)
    })
 
    // 5. PATCH partial update
    test('PATCH changes only the fields that were sent', async () => {
        await prisma.receiverPreference.create({ data: { receiver_id: 'user_partial' } })
 
        const res = await request(app)
            .patch(PREF_URL('user_partial'))
            .set('Authorization', AUTH)
            .send({ sms_enabled: true })
 
        const row = await prisma.receiverPreference.findUnique({ where: { receiver_id: 'user_partial' } })
 
        expect(res.status).toBe(200)
        expect(row?.sms_enabled).toBe(true)
        expect(row?.email_enabled).toBe(true)
        expect(row?.websocket_enabled).toBe(false)
    })
 
    // 6. PATCH invalidates the cache
    test('PATCH clears the cache, so the next GET returns fresh data', async () => {
        await prisma.receiverPreference.create({ data: { receiver_id: 'user_patch' } })
 
        await request(app).get(PREF_URL('user_patch')).set('Authorization', AUTH)
        expect(await redis.get(cacheKey('user_patch'))).not.toBeNull()
 
        const patch = await request(app)
            .patch(PREF_URL('user_patch'))
            .set('Authorization', AUTH)
            .send({ sms_enabled: true })
        expect(patch.status).toBe(200)
 
        expect(await redis.get(cacheKey('user_patch'))).toBeNull()
 
        const after = await request(app).get(PREF_URL('user_patch')).set('Authorization', AUTH)
        expect(after.body.preference.sms_enabled).toBe(true)
    })
 
    // 7. PATCH with a bad body
    test('PATCH with an invalid body returns 400 and changes nothing', async () => {
        await prisma.receiverPreference.create({ data: { receiver_id: 'user_bad' } })
 
        const res = await request(app)
            .patch(PREF_URL('user_bad'))
            .set('Authorization', AUTH)
            .send({ sms_enabled: 'banana' })
 
        const row = await prisma.receiverPreference.findUnique({ where: { receiver_id: 'user_bad' } })
 
        expect(res.status).toBe(400)
        expect(row?.sms_enabled).toBe(false)
    })
})