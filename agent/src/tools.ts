import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { makePrompt } from "prompt.ts";
import { Prompt } from "types.ts";
import { extractHTML, renderHtmlToImage } from "utils.ts";
import { z } from 'zod';
import { GoogleGenAI, Modality } from "@google/genai"
import { ArtifactsModule } from "artifacts/index.ts";


const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-preview-05-20",
  maxRetries: 3,
});

const artifactsBasePath = process.env.ARTIFACTS_PATH || './data/artifacts'; // Default to ./data/artifacts
const artifactsModule = new ArtifactsModule({ baseArtifactsPath: artifactsBasePath });

const gokoSchema = {
  name: "goko",
  description: "projecet a UI/UX discribtion to mini app as featuers and  return current html and screenshot of renderd mini app",
  schema: z.object({
    prompt: z.string().describe("UI/UX describtion with details and color, size, feeling, desgin system with specification of futuer and place of it"),
    images: z.array(z.object({ url: z.string(), description: z.string() })).describe("list of avalible image resoures")
  })
}
const goko = tool(async (input: any, config) => {
  const promptFn = makePrompt("goko") as Prompt
  if (typeof promptFn === "string") {
    throw Error("goko has a wrong prompt type")
  }
  const html = await artifactsModule.getHtml("farhoud", config.configurable.thread_id)
  const prompt = await promptFn({ design: input.prompt, images: input.images, current_app: html })
  console.log("goko prompt", prompt)

  const resp = await llm.invoke([new HumanMessage({ content: prompt })])

  const htmls = extractHTML(resp.text)


  const render = await renderHtmlToImage(htmls[0])
  console.log("thread_id inside node")
  if (config.configurable.thread_id)
    artifactsModule.saveHtml("farhoud", config.configurable.thread_id, htmls[0])

  return {
    html: htmls[0],
    render
  }
}, gokoSchema)


const magicCanves = tool(async (input: any) => {
  const promptFn = makePrompt("magic-canves") as Prompt
  if (typeof promptFn === "string") {
    throw Error("goko has a wrong prompt type")
  }
  console.log("magic input", input)
  const prompt = await promptFn({ prompt: input.description })
  console.log("magic prompt:", prompt)

  const resp = await createImageFn(prompt)

  return { url: resp, description: prompt }

}, {
  name: "magic-canves",
  description: "create image base on davinci description and return public url one at time",
  schema: z.object({
    description: z.string().describe("Image describtion with details and color, size, feeling, style, genre"),
  })

})

const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })

async function createImageFn(prompt: string): Promise<string> {

  // const resp = await genAI.models.generateContent({
  //   model: 'gemini-2.0-flash-preview-image-generation',
  //   contents: prompt,
  //   config: {
  //     responseModalities: [Modality.IMAGE, Modality.TEXT]
  //
  //   }
  // })
  // if (resp.candidates && resp.candidates.length > 0 && resp.candidates[0].content?.parts && resp.candidates[0].content?.parts.length > 0) {
  //   for (const p of resp.candidates && resp.candidates.length > 0 && resp.candidates[0].content?.parts || []) {
  //     if (p.inlineData?.data)
  //       // return p.inlineData?.data
  return "http://myhost.com/sege.png"
  //   }
  // }
  // throw "no image found"
}

export const tools = [goko, magicCanves]
