#!/usr/bin/env -S deno run -A --watch=static/,routes/
import { tailwind } from "@fresh/plugin-tailwind";

import { Builder } from "fresh/dev";
import { app } from "./main.ts";

// Auto-detect environment and configure MongoDB URI
async function setupEnvironment() {
  // Skip auto-configuration if MONGODB_URI is already set
  if (Deno.env.get("MONGODB_URI")) {
    console.log("Using existing MONGODB_URI:", Deno.env.get("MONGODB_URI"));
    return;
  }

  let mongoUri = "mongodb://localhost:27017";
  
  // Detect if running in WSL2 (now defaults to local MongoDB)
  if (Deno.build.os === "linux") {
    try {
      // Check if we're in WSL2 by looking for WSL-specific files
      const wslRelease = await Deno.readTextFile("/proc/version").catch(() => "");
      if (wslRelease.toLowerCase().includes("wsl") || wslRelease.toLowerCase().includes("microsoft")) {
        console.log("🐧 Detected WSL2 environment - using local MongoDB");
      } else {
        console.log("🐧 Detected native Linux environment");
      }
    } catch (error) {
      console.warn("⚠️  Could not detect environment, using localhost:", error.message);
    }
  } else if (Deno.build.os === "windows") {
    console.log("🪟 Detected Windows environment");
  } else if (Deno.build.os === "darwin") {
    console.log("🍎 Detected macOS environment");
  }

  // Set the MongoDB URI if not already set
  Deno.env.set("MONGODB_URI", mongoUri);
  console.log("📦 MongoDB URI:", mongoUri);
}

// Setup environment before starting the dev server
await setupEnvironment();

const builder = new Builder();
tailwind(builder, app, {});
if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(app);
}
