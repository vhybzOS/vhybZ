"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { Thread } from "@/components/thread";
import { ThreadList } from "@/components/thread-list";
import { createThread, sendMessage, getThreadState } from "@/lib/chat-api";
import { useRef } from "react";

export default function Assistant() {

  const threadIdRef = useRef<string | undefined>(undefined);
  const runtime = useLangGraphRuntime({
    threadId: threadIdRef.current,
    stream: async (messages) => {
      if (!threadIdRef.current) {
        const { thread_id } = await createThread();
        console.log("create thread id:", thread_id)
        threadIdRef.current = thread_id;
      }
      const threadId = threadIdRef.current;
      console.log("use thread id:", threadId)
      return sendMessage({
        threadId,
        messages,
      });
    },
    onSwitchToNewThread: async () => {
      const { thread_id } = await createThread();
      threadIdRef.current = thread_id;
    },
    onSwitchToThread: async (threadId) => {
      const state = await getThreadState(threadId);
      threadIdRef.current = threadId;
      return {
        messages: state.values.messages,
        interrupts: state.tasks[0]?.interrupts,
      };
    },
  });


  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-dvh flex-col justify-end align-end">
        {/* <ThreadList /> */}
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}
