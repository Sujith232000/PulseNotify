import express from 'express'
import { sendNotification } from './controllers/notificationController.js'
const app = express()

app.use(express.json())

app.post('/notification', sendNotification)

export default app