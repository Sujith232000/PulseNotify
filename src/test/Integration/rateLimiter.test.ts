import request from 'supertest'
import app from '../../app.js'
import { clearTestData, closeConnections } from './setup.js'

describe('rate Limiter middleware',()=>{
    beforeEach(async()=>{
        await clearTestData()
    })

    afterAll(async()=>{
        await closeConnections()
    })

    
    test('blocks 101 requests from the same token ', async()=>{
        const requests:Promise<request.Response>[] = []
        for (let i = 0; i<150; i++){
            requests.push(
            request(app)
              .get('/preference/user_123')
              .set('Authorization', 'Bearer key_dev_local_123')
            )
        }

       const responses =  await Promise.all(requests)
       const statuses = responses.map(r=> r.status)


         expect(statuses).toContain(429)
        }, 30000)
    })
