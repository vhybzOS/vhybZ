import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/thread";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export const iframeHeight = "800px"

export const description = "A sidebar with a header and a search form."

export default function Page() {
  const runtime = useChatRuntime({
    api: "/api/chat",
  });

  return (
    <ProtectedRoute>
      <div className="h-dvh flex flex-col [--header-height:calc(--spacing(14))]">
        <SidebarProvider className="flex flex-col">
          <SiteHeader />
          <div className="flex flex-1 overflow-hidden">
            <AppSidebar />
            <SidebarInset>
              <div className="flex h-full flex-col gap-4 p-4">
                <div className="bg-muted/50 flex h-full flex-col rounded-xl">
                  <AssistantRuntimeProvider runtime={runtime}>
                    <Thread />
                  </AssistantRuntimeProvider>
                </div>
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}
