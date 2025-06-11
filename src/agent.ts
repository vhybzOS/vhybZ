import { StateGraph, START, MemorySaver, END } from "@langchain/langgraph"
import { NamedMessages, Jodi, Human } from "nodes"


const builder = new StateGraph(NamedMessages)
  .addNode("jodiN", Jodi)
  .addNode("input", Human, { ends: ["jodiN", END] })
  .addEdge(START, "input")
  .addEdge("jodiN", "input")

const checkpointer = new MemorySaver()

export const graph = builder.compile({ checkpointer })
