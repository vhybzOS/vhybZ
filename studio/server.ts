import { serveDir, serveFile } from "jsr:@std/http/file-server";

const PORT = Number(Deno.env.get("PORT")) || 8000;

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Try to serve static files first
  try {
    const response = await serveDir(req, {
      fsRoot: "./build",
      quiet: true,
    });

    // If file exists and is found, serve it
    if (response.status !== 404) {
      return response;
    }
  } catch {
    // File doesn't exist, continue to SPA fallback
  }

  // For all other routes (SPA routing), serve index.html
  try {
    return await serveFile(req, "./build/index.html");
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

console.log(`🚀 Studio server running on port ${PORT}`);
console.log(`📁 Serving React app from ./build directory`);

Deno.serve({ port: PORT }, handler);