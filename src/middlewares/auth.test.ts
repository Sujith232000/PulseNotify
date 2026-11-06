import { jest, test, expect } from '@jest/globals';
import { authenticate } from './auth.js';

test('return 401 when there is no header', ()=>{
    const mockReq = {headers:{}} as any
    const mockRes = {status:jest.fn().mockReturnThis(), json: jest.fn()} as any
    const mockNext = jest.fn()

    authenticate(mockReq, mockRes, mockNext)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockNext).not.toHaveBeenCalled()

})

test('return 401 when header is malformed',()=>{
    process.env.API_KEYS = 'abc123,def456'
    const mockReq = {headers:{authorization: 'Bearer abc1234'}} as any 
    const mockRes = {status:jest.fn().mockReturnThis(), json: jest.fn()} as any
    const mockNext = jest.fn()

    authenticate(mockReq, mockRes, mockNext)
    expect(mockRes.status).toHaveBeenCalledWith(401)
    expect(mockNext).not.toHaveBeenCalled()

})

test('call next if key is valid', () => {
  process.env.API_KEYS = 'abc123,def456';
  const mockReq = { headers: { authorization: 'Bearer abc123' } } as any;
  const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
  const mockNext = jest.fn();

  authenticate(mockReq, mockRes, mockNext);

  expect(mockRes.status).not.toHaveBeenCalled();
  expect(mockNext).toHaveBeenCalled();
});