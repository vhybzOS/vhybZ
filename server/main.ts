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

// Helper function to get optional environment variables
function getOptionalEnv(key: string, defaultValue?: string): string | undefined {
  return Deno.env.get(key) ?? defaultValue;
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

// Check if Google OAuth is configured
const googleClientId = getOptionalEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = getOptionalEnv("GOOGLE_CLIENT_SECRET");
const hasGoogleAuth = googleClientId && googleClientSecret;

if (!hasGoogleAuth && !isProduction) {
  console.log("⚠️  Google OAuth not configured - running in dev mode with mock auth");
  console.log("ℹ️  To enable Google OAuth, set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET");
}

// Better Auth configuration
const authConfig: any = {
  database: mongodbAdapter(mongoClient, {
    databaseName: dbName,
  }),
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
};

// Add Google OAuth only if configured or in production
if (hasGoogleAuth || isProduction) {
  authConfig.socialProviders = {
    google: {
      clientId: googleClientId || "mock-client-id",
      clientSecret: googleClientSecret || "mock-client-secret", 
      redirectURI: isProduction
        ? "https://vhybz-server.deno.dev/api/auth/callback/google"
        : "http://localhost:8000/api/auth/callback/google",
    },
  };
}

const auth = betterAuth(authConfig);

// Initialize Hono app
const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());

// CORS middleware
app.use(
  "*",
  cors({
    origin: isProduction
      ? ["https://vhybz-studio.deno.dev", "https://vhybz.com"]
      : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: isProduction ? "production" : "development",
    database: dbName,
  });
});

// Better Auth routes - handles /api/auth/*
app.on(["POST", "GET"], "/api/auth/**", (c) => {
  return auth.handler(c.req.raw);
});

// Development-only mock login endpoint
if (!isProduction && !hasGoogleAuth) {
  app.post("/api/auth/dev-login", async (c) => {
    const body = await c.req.json();
    const mockUser = {
      id: "dev-user-123",
      email: body.email || "dev@example.com",
      name: body.name || "Dev User",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=dev",
      emailVerified: new Date(),
    };
    
    // Create a mock session (this is simplified - in real Better Auth this would be more complex)
    return c.json({ 
      success: true, 
      user: mockUser,
      message: "Mock login successful - dev mode only"
    });
  });

  app.get("/api/auth/dev-logout", (c) => {
    return c.json({ success: true, message: "Mock logout successful" });
  });
}

// Protected API routes
app.use("/api/me", async (c, next) => {
  try {
    await ensureMongoConnection();

    // In dev mode without Google Auth, allow mock authentication
    if (!isProduction && !hasGoogleAuth) {
      const devAuth = c.req.header("x-dev-auth");
      if (devAuth === "true") {
        const mockUser = {
          id: "dev-user-123",
          email: "dev@example.com", 
          name: "Dev User",
          image: "https://api.dicebear.com/7.x/avataaars/svg?seed=dev",
        };
        c.set("user", mockUser);
        c.set("session", { id: "dev-session-123" });
        await next();
        return;
      }
    }

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
    const authLinks = hasGoogleAuth || isProduction
      ? '<a href="/api/auth/sign-in/google">Login with Google</a>'
      : `
        <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>🛠️ Development Mode</h3>
          <p>Google OAuth not configured. Using mock authentication.</p>
          <p>To enable Google OAuth, set these environment variables:</p>
          <ul>
            <li>GOOGLE_CLIENT_ID</li>
            <li>GOOGLE_CLIENT_SECRET</li>
          </ul>
          <button onclick="mockLogin()" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            Mock Login (Dev Only)
          </button>
        </div>
        <script>
          async function mockLogin() {
            const response = await fetch('/api/auth/dev-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: 'dev@example.com', name: 'Dev User' })
            });
            const data = await response.json();
            alert(data.message);
          }
        </script>
      `;

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
          <p>Auth: Better Auth${hasGoogleAuth ? " + Google OAuth" : " (Mock Mode)"}</p>
          ${authLinks}
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
  console.log(
    "⚠️  Initial MongoDB connection failed, will retry on first request",
  );
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

Deno.serve({
  port: PORT,
  onListen: () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}`);
  },
}, app.fetch);

export default { fetch: app.fetch };
