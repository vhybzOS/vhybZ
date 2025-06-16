import { AIMessage, BaseMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { Annotation, Command, interrupt, messagesStateReducer } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { renderTemplate } from "./prompt.ts";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { tools } from "tools.ts";

export type AgentName = "daviciN" | "jodiN"
export type StateName = "davici" | "jodi"

export const NamedMessages = Annotation.Root({
  jodi: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  davici: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
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


function stateName(agentName: AgentName): StateName {
  return agentName.replace("N", "") as StateName
}

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-preview-05-20",
  maxRetries: 3,
  temperature: 0.7
});

async function callLLM(model: Runnable, msgs: BaseMessage[], config?: RunnableConfig): Promise<BaseMessage[]> {
  const resp = await model.invoke(msgs, config)
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
  const msgs: BaseMessage[] = []
  if (state.jodi.length < 1 && prompt) {
    msgs.push(new AIMessage({ content: prompt }))
    return { jodi: msgs, lastAgent: name }
  }
  msgs.push(...state.jodi)
  const llmResp = await callLLM(llm, msgs, config)
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
  const llmWithTools = llm.bindTools(tools)
  return { davici: await callLLM(llmWithTools, msgs, config), lastAgent: name }

}

export async function ToolExecutor(state: GraphState, config?: RunnableConfig) {
  const sn = stateName(state.lastAgent)
  const toolCalls = state[sn].at(-1) as AIMessage
  if (!toolCalls || !toolCalls.tool_calls || toolCalls.tool_calls.length < 1) {
    throw new Error("there is no function call")
  }
  const tresp = await toolNode.invoke({ messages: [toolCalls] }, config)
  return new Command({
    goto: state.lastAgent,
    update: {
      [sn]: [
        ...tresp.messages
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
      [stateName(agent)]: [
        {
          "role": "user",
          "content": userInput,
        }
      ]
    }
  });
  return command
}




