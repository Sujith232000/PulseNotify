import express from 'express'
import { sendNotification } from './controllers/notificationController.js'
import { updatePreferences } from './controllers/prefernceController.js'
import { getpreferences } from './controllers/prefernceController.js'
import{authenticate} from './middlewares/auth.js'
import { rateLimiter } from './middlewares/rateLimiter.js'
const app = express()

app.use(express.json())
app.use(authenticate)
app.use(rateLimiter) 

app.post('/notification', sendNotification)
app.patch('/preference/:receiverId', updatePreferences)
app.get('/preference/:receiverId', getpreferences)
export default app