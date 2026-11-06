import request from 'supertest'
import app from '../../app.js'
import { clearTestData } from './setup.js'
import { closeConnections } from './setup.js'

describe('authenticate middleware', () => {
  beforeEach(async()=>{
    await clearTestData()
  })

  afterAll(async () => {
    await closeConnections()
  })
  test('no authorization header returns 401', async () => {
    const res = await request(app).get('/preference/user_123')

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('No header provided')
  })

  test('malformed header returns 401', async () => {
    const res = await request(app)
      .get('/preference/user_123')
      .set('Authorization', 'Bearer aksdpfpqweoijaiofj')

    expect(res.status).toBe(401)
    expect(res.body.message).toBe('Invalid authentication token')
  })
})