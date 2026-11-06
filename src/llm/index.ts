import {type Summarizer } from "./summarizer.js";
import { FakeSummarizer } from "./fakeSummarizer.js";
import { config } from "../config/config.js"

function createSummarizer(): Summarizer{
    if (config.llm.provider === "fake"){
        return new FakeSummarizer()
    }
    throw new Error(`Unknown LLM_PROVIDER: ${JSON.stringify(config.llm.provider)}`)

}
export const summarizer = createSummarizer()