import { StateGraph, START, MemorySaver, END } from "@langchain/langgraph"
import { NamedMessages, Jodi, Human, Davici, GraphState } from "./nodes.ts"
import { MongoClient } from "mongodb";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";

if (!process.env.MONGODB_URL) {
  throw new Error("no mongo db url provided")
}
const client = new MongoClient(process.env.MONGODB_URL);

const builder = new StateGraph(NamedMessages)
  .addNode("jodiN", Jodi)
  .addNode("input", Human, { ends: ["jodiN", "daviciN", END] })
  .addEdge(START, "jodiN")
  .addConditionalEdges("jodiN", (state: GraphState) => {
    if (state.jodi.length > 1 && state.jodi.at(-1)) {
      const msg = state.jodi.at(-1)
      if (msg?.text.includes("LETS BUILD THIS")) {
        return "daviciN"
      }
    }
    return "input"
  })
  .addNode("daviciN", Davici)
  .addEdge("daviciN", "input")

const checkpointer = new MongoDBSaver({ client })

export const graph = builder.compile({ checkpointer })
