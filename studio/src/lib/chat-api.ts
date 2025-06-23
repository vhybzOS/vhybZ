import { Client, type ThreadState } from "@langchain/langgraph-sdk";
import type { LangChainMessage } from "@assistant-ui/react-langgraph";

const createClient = () => {
  const apiUrl = import.meta.env.VITE_LANGGRAPH_API_URL || "/api";
  console.log("langgraph-api-utl: ", apiUrl)
  return new Client({
    apiUrl,
  });
};

export const createThread = async () => {
  const client = createClient();
  const thread = await client.threads.create();
  return thread
};

export const getThreadState = async (
  threadId: string,
): Promise<ThreadState<{ messages: LangChainMessage[] }>> => {
  const client = createClient();
  return client.threads.getState(threadId);
};

export const sendMessage = async (params: {
  threadId: string;
  messages: LangChainMessage[];
}) => {
  const client = createClient();
  return client.runs.stream(
    params.threadId,
    import.meta.env.VITE_LANGGRAPH_ASSISTANT_ID!,
    {
      input: {
        messages: params.messages,
      },
      streamMode: "messages",
    },
  );
};
