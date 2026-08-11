import { smsQueue } from "./queues/smsQueue.js";
import { emailQueue } from "./queues/emailQueue.js";
import { websocketQueue } from "./queues/websocketQueue.js";

export const channelQueues = {
    email: emailQueue,
    sms: smsQueue,
    websocket: websocketQueue
}

