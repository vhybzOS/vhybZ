import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { makePrompt } from "prompt";
import { Prompt } from "types";
import { z } from 'zod';


const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-preview-05-20",
  maxRetries: 3,
});


const gokoSchema = {
  name: "goko",
  description: "casting a UI/UX discribtion to mock preview mini app for user",
  schema: z.object({
    prompt: z.string().describe("UI/UX describtion with details and color, size, feeling, desgin system"),
  })
}
const goko = tool(async (input: any) => {
  const promptFn = makePrompt("goko") as Prompt
  if (typeof promptFn === "string") {
    throw Error("goko has a wrong prompt type")
  }
  const prompt = await promptFn({ desgin: input.prompt })

  const resp = await llm.invoke([new HumanMessage({ content: prompt })])

  return resp.text
}, gokoSchema)

export const tools = [goko]
