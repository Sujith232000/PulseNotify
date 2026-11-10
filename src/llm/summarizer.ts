import {type NotificationInput } from "../batchingService.js";
export interface Summarizer{
    summarize(events:NotificationInput[]):Promise<string>;
}

export function sleep(ms: number): Promise<void>{
    return new Promise((resolve)=> setTimeout(resolve,ms))
}

export function withTimeout<T>(work:Promise<T>, ms: number):Promise<T>{
    let timerId: NodeJS.Timeout;

    const timerPromise = new Promise<never>((_, reject) =>{
        timerId = setTimeout(()=>{
         reject(new Error("LLM timed out after" +ms+ "ms"))
       },ms)
    })

    return Promise.race([work, timerPromise]).finally(()=>{
        clearTimeout(timerId);
    })
}