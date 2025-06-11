import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { Annotation, Command, interrupt, messagesStateReducer } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { RunnableConfig } from "@langchain/core/runnables";
import { renderTemplate } from "./prompt";

export const NamedMessages = Annotation.Root({
  jodi: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => []
  }),
  lastAgent: Annotation<string>({
    reducer: (_, y) => y,
  })
})

export type GraphState = typeof NamedMessages.State


const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-preview-05-20",
  maxRetries: 3,
});


export async function Jodi(state: GraphState, config?: RunnableConfig) {
  const name = "jodi"
  const prompt = await renderTemplate(name, {})
  const msgs: BaseMessage[] = []
  if (state.jodi.length < 2 && prompt) {
    msgs.push(new AIMessage({ content: prompt }))
  }
  msgs.push(...state.jodi)
  const resp = await llm.invoke(msgs, config)

  msgs.push(resp)
  return { jodi: msgs, lastAgent: name }
}


export function Human(state: GraphState): Command {
  const userInput: string = interrupt("ready for user input")
  let agent = "jodiN"
  if (state.lastAgent) {
    // throw new Error("Could not determine the active agent.")
    agent = state.lastAgent
  }

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




