import {z} from 'zod';

export const idempotencyKeySchema = z.uuid()