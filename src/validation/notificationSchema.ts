import {z} from 'zod';
export const notificationSchema = z.object({
    userId: z.number(),
    receiverId: z.number(),
    message: z.string().nonempty(),
    channel: z.enum(["email","sms", "websocket"])
})
