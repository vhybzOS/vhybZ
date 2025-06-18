import { StateGraph, START, MemorySaver, END } from "@langchain/langgraph"
import { NamedMessages, Jodi, Human, Davici, GraphState, ToolExecutor } from "./nodes.ts"
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { AIMessage } from "@langchain/core/messages";

if (!process.env.MONGODB_URL) {
  throw new Error("no mongo db url provided")
}
const client = new MongoClient(process.env.MONGODB_URL);

const builder = new StateGraph(NamedMessages)
  .addNode("jodiN", Jodi, { ends: ["input", "daviciN"] })
  .addNode("input", Human, { ends: ["jodiN", "daviciN"] })
  .addNode("daviciN", Davici, { ends: ["input", "executorN", END] })
  .addNode("executorN", ToolExecutor, { ends: ["daviciN"] })
  .addEdge(START, "jodiN")
  .addConditionalEdges("jodiN", (state: GraphState) => {
    const mem = state.messages
    if (mem.length > 1 && mem.at(-1)) {
      const msg = mem.at(-1)
      if (msg?.text.includes("LETS BUILD THIS")) {
        return "daviciN"
      }
    }
    return "input"
  }, ["input", "daviciN"])
  .addConditionalEdges("daviciN", (state: GraphState) => {
    const mem = state.messages
    const resp = mem.at(-1) as AIMessage
    if (resp && resp.tool_calls && resp.tool_calls.length > 0) {
      return "executorN"
    }
    return "input"
  }, ["executorN", "input"])

const checkpointer = new MongoDBSaver({ client })

export const graph = builder.compile({ checkpointer })
