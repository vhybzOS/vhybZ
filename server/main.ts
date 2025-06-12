import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { load } from "std/dotenv";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

// Load environment variables from .env file in development
const isDeno = typeof Deno !== "undefined";
const isProduction = isDeno && (
  Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined ||
  Deno.env.get("MONGODB_ATLAS_URI") !== undefined ||
  Deno.env.get("NODE_ENV") === "production" ||
  Deno.env.get("GITHUB_ACTIONS") === "true"
);

if (!isProduction) {
  try {
    await load({ export: true });
    console.log("🛠️  Loaded environment variables from .env file");
  } catch (error) {
    console.log("ℹ️  No .env file found, using system environment variables");
  }
}

// Helper function to get environment variables
function getEnv(key: string, defaultValue?: string): string {
  const value = Deno.env.get(key) ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

// Configure MongoDB
let mongoUri: string;
let dbName: string;

if (isProduction) {
  mongoUri = getEnv("MONGODB_ATLAS_URI");
  dbName = getEnv("MONGODB_DB_NAME", "vhybZ-prod");
  console.log("🚀 Production environment detected - using MongoDB Atlas");
} else {
  mongoUri = getEnv("MONGODB_URI", "mongodb://localhost:27017");
  dbName = getEnv("MONGODB_DB_NAME", "vhybZ-dev");
  console.log("🛠️  Development environment detected - using local MongoDB");
}

console.log(`Database: ${dbName}`);

// Initialize MongoDB client with connection options
const mongoClient = new MongoClient(mongoUri, {
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  maxPoolSize: 10,
  retryWrites: true,
});

// Better Auth configuration
const auth = betterAuth({
  database: mongodbAdapter(mongoClient, {
    databaseName: dbName,
  }),
  socialProviders: {
    google: {
      clientId: getEnv("GOOGLE_CLIENT_ID"),
      clientSecret: getEnv("GOOGLE_CLIENT_SECRET"),
      redirectURI: isProduction 
        ? "https://vhybz-server.deno.dev/api/auth/callback/google"
        : "http://localhost:8000/api/auth/callback/google",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  cors: {
    origin: isProduction 
      ? ["https://vhybz-studio.deno.dev", "https://vhybz.com"]
      : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});

// Initialize Hono app
const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());

// CORS middleware
app.use("*", cors({
  origin: isProduction 
    ? ["https://vhybz-studio.deno.dev", "https://vhybz.com"]
    : ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    environment: isProduction ? "production" : "development",
    database: dbName
  });
});

// Better Auth routes - handles /api/auth/*
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Protected API routes
app.use("/api/me", async (c, next) => {
  try {
    await ensureMongoConnection();
    
    const session = await auth.api.getSession({
      headers: c.req.header(),
    });

    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    c.set("user", session.user);
    c.set("session", session.session);
    await next();
  } catch (error) {
    console.error("Database connection error:", error);
    return c.json({ error: "Database connection failed" }, 503);
  }
});

// User profile endpoint
app.get("/api/me", (c) => {
  const user = c.get("user");
  return c.json({ user });
});

// Conversations API (placeholder for now)
app.get("/api/conversations", async (c) => {
  const user = c.get("user");
  // TODO: Implement conversation logic with MongoDB
  return c.json({ conversations: [], userId: user?.id });
});

app.post("/api/conversations", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  // TODO: Implement conversation creation
  return c.json({ success: true, userId: user?.id, data: body });
});

// Artifacts API (placeholder for now)  
app.get("/api/artifacts", async (c) => {
  const user = c.get("user");
  // TODO: Implement artifact logic with MongoDB
  return c.json({ artifacts: [], userId: user?.id });
});

app.post("/api/artifacts", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  // TODO: Implement artifact creation
  return c.json({ success: true, userId: user?.id, data: body });
});

// Serve React app assets (for development)
app.get("/assets/*", async (c) => {
  const path = c.req.path;
  try {
    const file = await Deno.open(`./static${path}`, { read: true });
    const readableStream = file.readable;
    return new Response(readableStream);
  } catch {
    return c.notFound();
  }
});

// Catch-all for React app (SPA routing)
app.get("*", async (c) => {
  try {
    const html = await Deno.readTextFile("./static/index.html");
    return c.html(html);
  } catch {
    return c.html(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>vhybZ Server</title>
        </head>
        <body>
          <h1>🔥 vhybZ Hono Server</h1>
          <p>Environment: ${isProduction ? "production" : "development"}</p>
          <p>Database: ${dbName}</p>
          <p>Auth: Better Auth + Google OAuth</p>
          <a href="/api/auth/sign-in/google">Login with Google</a>
        </body>
      </html>
    `);
  }
});

// Lazy MongoDB connection helper
let isConnected = false;
const ensureMongoConnection = async () => {
  if (!isConnected) {
    try {
      await mongoClient.connect();
      isConnected = true;
      console.log("🔥 Successfully connected to MongoDB");
    } catch (error) {
      console.error("❌ Failed to connect to MongoDB:", error);
      throw error;
    }
  }
};

// Connect to MongoDB on startup (but don't fail if it doesn't work)
try {
  await ensureMongoConnection();
  console.log("🔐 Better Auth configured with Google OAuth");
} catch (error) {
  console.log("⚠️  Initial MongoDB connection failed, will retry on first request");
}

// Graceful shutdown
const shutdown = async () => {
  console.log("\n🔥 Shutting down Hono server gracefully...");
  try {
    await mongoClient.close();
    console.log("📄 MongoDB connection closed");
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
  }
  // Don't call Deno.exit() in Deno Deploy
};

// Handle shutdown signals
const signals: Deno.Signal[] = ["SIGINT"];
if (Deno.build.os !== "windows") {
  signals.push("SIGTERM", "SIGQUIT");
}

signals.forEach((signal) => {
  try {
    Deno.addSignalListener(signal, shutdown);
  } catch (error) {
    console.warn(`⚠️  Failed to set up signal handler for ${signal}:`, error);
  }
});

const PORT = Number(Deno.env.get("PORT")) || 8000;

console.log(`🔥 Hono server starting on port ${PORT}`);
console.log(`🌐 Environment: ${isProduction ? "production" : "development"}`);
console.log(`🗄️  Database: ${dbName}`);
console.log(`🔐 Auth: Better Auth + Google OAuth`);

export default {
  port: PORT,
  fetch: app.fetch,
};