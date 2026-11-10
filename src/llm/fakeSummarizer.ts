import {sleep, type Summarizer } from "./summarizer.js";
import {type NotificationInput } from "../batchingService.js";
import { validateReply } from "./replySchema.js";
import { config } from "../config/config.js";
export class FakeSummarizer implements Summarizer {
    constructor (private mode: "OK"| "Fail"|"Empty"|"TooLong"|"Slow" = "OK"){}
    async summarize(events: NotificationInput[]): Promise <string>{
        if (this.mode === "Fail"){
            throw new Error("Fake LLM Failure")
        }
        let raw: string
        if (this.mode === "Empty"){
            raw = ""
        }
        else if (this.mode === "TooLong"){
            raw = "x".repeat(config.llm.max_reply_chars+1)
        }
        else if(this.mode === "Slow"){
            await sleep(10000)
            raw = "Fake LLM Digest"
        }
        else{
            raw = 'Fake LLM Digest'
        }
        return validateReply(raw)
    }
}
