import { AIMessage, BaseMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { Annotation, Command, interrupt, messagesStateReducer, MessagesAnnotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { renderTemplate } from "./prompt.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tools } from "tools.ts";

export type AgentName = "daviciN" | "jodiN"

export const NamedMessages = Annotation.Root({
  ...MessagesAnnotation.spec,
  lastAgent: Annotation<AgentName>({
    reducer: (_, y) => y,
  }),
  html: Annotation<string>({
    reducer: (_, y) => y,
  }),
  render: Annotation<string>({
    reducer: (_, y) => y,
  })
})

export type GraphState = typeof NamedMessages.State

const toolNode = new ToolNode(tools)


const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-preview-05-20",
  maxRetries: 3,
  temperature: 0.7
});

async function callLLM(model: Runnable, msgs: BaseMessage[], name: string, config?: RunnableConfig): Promise<BaseMessage[]> {
  const resp = await model.invoke(msgs, config)
  resp.additional_kwargs.name = name

  const newMsgs = msgs.slice()

  newMsgs.push(resp)
  // if (resp.tool_calls && resp.tool_calls.length > 0) {
  //   const tresp = await toolNode.invoke({ messages: [resp] })
  //   newMsgs.push(...tresp.messages)
  //   return await callLLM(model, newMsgs)
  // }
  return newMsgs
}

export async function Jodi(state: GraphState, config?: RunnableConfig) {
  const name = "jodiN"
  const prompt = await renderTemplate("jodi", {})
  const mem = state.messages.filter(i => i.additional_kwargs.name === name)
  if (mem.length < 1 && prompt) {
    mem.push(new AIMessage({ content: prompt, additional_kwargs: { name: name } }))
    return { messages: mem, lastAgent: name }
  }
  const llmResp = await callLLM(llm, mem, name, config)
  return { messages: llmResp, lastAgent: name }
}

export async function Davici(state: GraphState, config?: RunnableConfig) {
  const name = "daviciN"
  const prompt = await renderTemplate("davici", {})

  const mem = state.messages.filter(i => i.additional_kwargs.name === name)
  if (mem.length < 1 && prompt) {
    mem.push(new AIMessage({ content: prompt, additional_kwargs: { name: name } }))
    const { content } = state.messages.filter(i => i.additional_kwargs.name === "jodiN").at(-1)!
    mem.push(new HumanMessage({ content, additional_kwargs: { name: name } }))
  }
  const llmWithTools = llm.bindTools(tools)
  return { messages: await callLLM(llmWithTools, mem, name, config), lastAgent: name }

}

export async function ToolExecutor(state: GraphState, config?: RunnableConfig) {
  const toolCalls = state.messages.at(-1) as AIMessage
  if (!toolCalls || !toolCalls.tool_calls || toolCalls.tool_calls.length < 1) {
    throw new Error("there is no function call")
  }

  const tresp = await toolNode.invoke({ messages: [toolCalls] }, config)
  const msgs = tresp.messages.map((i: BaseMessage) => {
    i.additional_kwargs.name = toolCalls.additional_kwargs.name
    return i
  })
  return new Command({
    goto: state.lastAgent,
    update: {
      messages: [
        ...msgs
      ]
    }
  });
}

export function Human(state: GraphState): Command {
  if (!state.lastAgent) {
    throw new Error("Could not determine the active agent.")
  }
  const agent = state.lastAgent
  const userInput: string = interrupt({ agent, text: "ready for user input" })
  const command = new Command({
    goto: agent,
    update: {
      messages: [
        new HumanMessage({ content: userInput, additional_kwargs: { name: agent } })
      ]
    }
  });
  return command
}




