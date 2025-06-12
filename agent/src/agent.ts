import { StateGraph, START, MemorySaver, END } from "@langchain/langgraph"
import { NamedMessages, Jodi, Human, Davici, GraphState } from "nodes"


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

const checkpointer = new MemorySaver()

export const graph = builder.compile({ checkpointer })
