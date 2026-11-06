import {type NotificationInput } from "../batchingService.js";
export interface Summarizer{
    summarize(events:NotificationInput[]):Promise<string>;
}