import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Annotation, Command, interrupt, messagesStateReducer } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { renderTemplate } from "./prompt";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tools } from "tools";

export const NamedMessages = Annotation.Root({
  jodi: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  davici: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  lastAgent: Annotation<string>({
    reducer: (_, y) => y,
  }),
  html: Annotation<string>
})

export type GraphState = typeof NamedMessages.State

const toolNode = new ToolNode(tools)

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-preview-05-20",
  maxRetries: 3,
  temperature: 0.7
});

async function callLLM(model: Runnable, msgs: BaseMessage[], config?: RunnableConfig): Promise<BaseMessage[]> {
  const resp = await model.invoke(msgs, config)
  console.log("failed here")
  const newMsgs = msgs.slice()
  newMsgs.push(resp)
  if (resp.tool_calls && resp.tool_calls.length > 0) {
    const tresp = await toolNode.invoke({ messages: [resp] })
    console.log("tool respoonse", tresp)
    newMsgs.push(...tresp.messages)
    console.log(newMsgs)
    return await callLLM(model, newMsgs)
  }
  return newMsgs
}

export async function Jodi(state: GraphState, config?: RunnableConfig) {
  const name = "jodiN"
  const prompt = await renderTemplate("jodi", {})
  const msgs: BaseMessage[] = []
  if (state.jodi.length < 1 && prompt) {
    msgs.push(new AIMessage({ content: prompt }))
    return { jodi: msgs, lastAgent: name }
  }
  msgs.push(...state.jodi)
  console.log("msgs length before", msgs.length)
  const llmResp = await callLLM(llm, msgs)
  console.log("msgs length after", msgs.length)
  console.log(llmResp)
  return { jodi: llmResp, lastAgent: name }
}

export async function Davici(state: GraphState, config?: RunnableConfig) {
  const name = "daviciN"
  const prompt = await renderTemplate("davici", {})

  const msgs: BaseMessage[] = []
  if (state.davici.length < 1 && prompt) {
    msgs.push(new AIMessage({ content: prompt }))
    const { content } = state.jodi.at(-1)!
    msgs.push(new HumanMessage({ content }))
  }
  msgs.push(...state.davici)
  console.log(msgs)
  const llmWithTools = llm.bindTools(tools)
  return { davici: await callLLM(llmWithTools, msgs), lastAgent: name }

}


export function Human(state: GraphState): Command {
  const userInput: string = interrupt("ready for user input")
  let agent = "jodiN"
  if (state.lastAgent) {
    // throw new Error("Could not determine the active agent.")
    agent = state.lastAgent
  }
  console.log(agent)
  const command = new Command({
    goto: agent,
    update: {
      [agent.replace("N", "")]: [
        {
          "role": "user",
          "content": userInput,
        }
      ]
    }
  });
  return command
}




