import {z} from 'zod';

export const updatePreferenceSchema = z.object({
    sms_enabled: z.boolean().optional(),
    email_enabled: z.boolean().optional(),
    websocket_enabled: z.boolean().optional()
})