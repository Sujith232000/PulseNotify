import {z} from 'zod';
export const notificationSchema = z.object({
    userId: z.number(),
    receiverId: z.string(),
    message: z.string().optional(),
    channel: z.enum(["email","sms", "websocket"]),
    type: z.enum(['post','like','comment','follow','mention', 'message', 'subscribe','unsubscribe']),
    priority: z.enum(['batching','urgent'])
}).refine((data) => {
    if(data.priority === 'urgent' && !data.message){
        return false
    }
    return true
},{
    message: 'message is required when priority is urgent'
})

export const preferenceSchema = z.object({
  id: z.number(),
  receiver_id: z.string(),
  email_enabled: z.boolean(),
  sms_enabled: z.boolean(),
  websocket_enabled: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
