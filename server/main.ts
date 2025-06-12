import { App, fsRoutes, staticFiles } from "fresh";
import { db, ensureDbConnection } from "./database.ts";
import { define, type State } from "./utils.ts";
import { OAuth2Client } from "oauth2_client";
import { getCookies, setCookie } from "std/http/cookie";
import { serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

// OAuth2 client setup
const oauth2Client = new OAuth2Client({
  clientId: Deno.env.get("GOOGLE_CLIENT_ID") || "",
  clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
  authorizationEndpointUri: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUri: "https://oauth2.googleapis.com/token",
  redirectUri: "http://localhost:8000/auth/google/callback",
  defaults: {
    scope: ["profile", "email"],
  },
});

// Session middleware
const sessionMiddleware = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);
  const sessionId = cookies.session;

  if (sessionId) {
    ctx.state.session = { userId: sessionId };
  }

  return await ctx.next();
});

// Auth middleware
const requireAuth = define.middleware((ctx) => {
  if (!ctx.state.session?.userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  return ctx.next();
});

export const app = new App<State>();

// CORS middleware for React dev server
app.use(async (ctx) => {
  // Handle preflight OPTIONS requests
  if (ctx.req.method === 'OPTIONS') {
    const response = new Response(null, { status: 204 });
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
  }

  const response = await ctx.next();
  
  // Allow credentials for auth cookies
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:5173');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
});

// Global middleware
app.use(sessionMiddleware).use(staticFiles());

// Serve React app assets
app.use(async (ctx) => {
  const url = new URL(ctx.req.url);
  
  // Serve built React app assets and favicon
  if (url.pathname.startsWith("/assets/") || url.pathname === "/logo.png") {
    try {
      const filePath = `./web-vhybZ/dist${url.pathname}`;
      const response = await serveFile(ctx.req, filePath);
      return response;
    } catch {
      return new Response("Not Found", { status: 404 });
    }
  }
  
  // Continue to next middleware
  return await ctx.next();
});

// Google OAuth routes
app.get("/auth/google", async (ctx) => {
  const authUri = await oauth2Client.code.getAuthorizationUri();

  const response = new Response(null, {
    status: 302,
    headers: {
      Location: authUri.toString(),
    },
  });

  setCookie(response.headers, {
    name: "code_verifier",
    value: authUri.codeVerifier,
    httpOnly: true,
    path: "/",
    maxAge: 600, // 10 minutes
  });

  return response;
});

app.get("/auth/google/callback", async (ctx) => {
  const url = new URL(ctx.req.url);
  const code = url.searchParams.get("code");
  const cookies = getCookies(ctx.req.headers);
  const codeVerifier = cookies.code_verifier;

  if (!code || !codeVerifier) {
    return new Response("Invalid request", { status: 400 });
  }

  try {
    const tokens = await oauth2Client.code.getToken(url, { codeVerifier });
    const userInfo = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      },
    ).then((r) => r.json());

    const user = await db.findOrCreateUser({
      id: userInfo.sub,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    });

    if (!user._id) {
      throw new Error("User creation failed");
    }

    const response = new Response(null, {
      status: 302,
      headers: { Location: "/" },
    });

    setCookie(response.headers, {
      name: "session",
      value: user._id.toString(),
      path: "/",
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("OAuth error:", error);
    return new Response("Authentication failed", { status: 500 });
  }
});

// Protected route
app.get("/profile", requireAuth, (ctx) => {
  return new Response(`Welcome user ${ctx.state.session?.userId}`);
});

// Get current user
app.get("/api/user", requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.session?.userId;
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await db.getUser(userId);
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    return Response.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    return new Response("Internal server error", { status: 500 });
  }
});

// Logout
app.post("/auth/logout", () => {
  const response = new Response(null, {
    status: 302,
    headers: { Location: "/" },
  });

  setCookie(response.headers, {
    name: "session",
    value: "",
    path: "/",
    expires: new Date(0),
  });

  return response;
});

await ensureDbConnection();

// API routes from Fresh
await fsRoutes(app, {
  loadIsland: (path) => import(`./islands/${path}`),
  loadRoute: (path) => import(`./routes/${path}`),
});

// Catch-all route to serve React app for frontend routes
app.use(async (ctx) => {
  const url = new URL(ctx.req.url);
  
  // Skip API routes, auth routes, and static assets
  if (url.pathname.startsWith("/api/") || 
      url.pathname.startsWith("/auth/") || 
      url.pathname.startsWith("/assets/") ||
      url.pathname.startsWith("/static/")) {
    return await ctx.next();
  }
  
  // Serve React app index.html for all other routes
  try {
    const response = await serveFile(ctx.req, "./web-vhybZ/dist/index.html");
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error serving React app:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

if (import.meta.main) {
  await app.listen({ port: 8000 });
}
