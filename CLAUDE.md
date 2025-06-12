# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this monorepo.

## IMPORTANT: Always Check DIARY.md
- **Read DIARY.md first** on each startup to understand project history and recent changes
- **Update DIARY.md** with a timestamped entry for every change you make
- Include change type, description, rationale, and files modified in each entry

## Monorepo Structure

This is a monorepo containing:
- **@server/** - Deno backend (Fresh 2.0 framework)
- **@studio/** - React frontend (Vite + shadcn/ui)

## Development Commands

### Server (@server/)
Use Deno commands in the server directory:
- `deno task dev` - Start development server (builds React app and runs Deno backend)
- `deno task dev:react` - Run React app in development mode only
- `deno task build` - Build the application for production
- `deno task start` - Run production server
- `deno task check` - Run all checks (format, lint, type checking)
- `deno task update` - Update Fresh framework

### Studio (@studio/)
Use npm commands in the studio directory:
- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build production bundle (TypeScript + Vite)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Quality Assurance
Before committing changes, always run:
- **Server**: `deno task check` - Validates formatting, linting, and type checking
- **Studio**: `npm run lint` && `npm run build` - Validates code style and build

## Architecture Overview

### Platform Vision
vhybZ is an AI-powered platform for building interactive digital artifacts through natural language conversations. The platform serves multiple clients and hosts user-generated artifacts on custom subdomains.

### Repository Architecture
- **@server/** (Backend API): Deno/Fresh backend for data store, authentication, public hosting
- **@studio/** (Web Client): React application providing web interface for vhybZ platform
- **vhybZ Library** (External): Core AI/LLM logic (repo: https://github.com/vhybzOS/vhybZ)
- **Mobile App** (Future): React Native app (repo: https://github.com/vhybzOS/RN-vhybZ)

### Separation of Concerns
- **@server/**: Data store, authentication, public hosting, analytics, artifact serving
- **@studio/**: React UI layer, user experience, vhybZ library integration
- **vhybZ Library**: LLM interactions, HTML generation, real-time preview logic
- **Artifact Hosting**: Custom subdomains at `username.vhybz.com/artifact-name`

## Server Technology Stack (@server/)

### Core Technologies
- **Runtime**: Deno with JSR package management
- **Framework**: Fresh 2.0 (file-based routing)
- **UI**: Preact with Tailwind CSS
- **Database**: MongoDB with Zod validation
- **Auth**: Google OAuth 2.0 with session cookies

### Application Structure
- **main.ts**: Core application with OAuth routes and middleware setup
- **dev.ts**: Development server with Tailwind plugin
- **database.ts**: MongoDB operations with comprehensive Zod schemas
- **utils.ts**: Shared state interface and Fresh utilities
- **routes/**: File-based routing (Fresh convention)
- **islands/**: Interactive Preact components (Fresh islands architecture)
- **components/**: Server-side Preact components

### Key Patterns

#### Authentication Flow
- Google OAuth integration in `main.ts` with PKCE flow
- Session management via HTTP-only cookies
- `sessionMiddleware` and `requireAuth` middleware for route protection
- User creation/lookup in MongoDB via `db.findOrCreateUser()`

#### Database Operations
- Singleton database instance exported as `db`
- Zod schemas for type safety and validation (`UserSchema`, `AppSchema`)
- Environment-based MongoDB configuration with defaults
- Graceful shutdown handling for database connections

#### State Management
- Fresh's built-in state system via `createDefine<State>()`
- Session state attached to request context
- Islands use Preact signals for client-side reactivity

### Environment Setup (Server)
Required environment variables:
- `MONGODB_URI` (defaults to local MongoDB)
- `MONGODB_DB_NAME` (defaults to "vhybZ")
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth

## Studio Technology Stack (@studio/)

### Core Technologies
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 with hot module replacement
- **UI Library**: shadcn/ui with Tailwind CSS (migrated from Material-UI)
- **State Management**: React Context + Hooks pattern
- **Routing**: React Router for SPA navigation
- **Development**: ESLint with React-specific rules

### Application Structure
```
src/
├── components/     # Reusable UI components
├── pages/         # Route-based page components
├── hooks/         # Custom React hooks
├── services/      # API integration and vhybZ library usage
├── utils/         # Shared utilities and helpers
├── types/         # TypeScript type definitions
└── styles/        # Global styles and themes
```

### Key Integration Patterns

#### vhybZ Library Usage
```typescript
import { VhybZGenerator, SOULAgent } from '@vhybzOS/vhybZ';

// Initialize generator with backend API
const generator = new VhybZGenerator({
  apiEndpoint: process.env.REACT_APP_API_URL,
  authToken: userToken
});

// Create artifact with real-time preview
const createArtifact = async (prompt: string) => {
  const stream = generator.createArtifact({
    prompt,
    onUpdate: (update) => {
      // Update preview in real-time
      setPreviewContent(update.html);
    },
    onComplete: (artifact) => {
      // Handle completion
      saveArtifact(artifact);
    }
  });
};
```

#### Backend API Integration
```typescript
// Authentication with backend
const authenticate = async () => {
  window.location.href = `${API_URL}/auth/google`;
};

// Save artifact to backend
const saveArtifact = async (artifact: Artifact) => {
  const response = await fetch(`${API_URL}/api/artifacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify(artifact)
  });
};
```

#### Real-time Preview System
```typescript
// Safe artifact preview component
function ArtifactPreview({ content }: { content: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument;
      
      // Safely render content in sandboxed iframe
      doc?.open();
      doc?.write(content);
      doc?.close();
    }
  }, [content]);
  
  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
```

## Core Product Flow

1. Users authenticate via backend Google OAuth
2. **Studio** imports **vhybZ library** for ChatGPT-like interface and LLM calls
3. **vhybZ library** generates interactive HTML artifacts with real-time preview
4. **Backend** stores artifacts sent by studio ("vibe coding" logic in vhybZ library)
5. **Backend** serves final artifacts on custom URLs for public sharing

## Current Implementation Status

### Server Features
- ✅ Basic auth, user management, and app CRUD
- ❌ Conversation and artifact storage APIs  
- ❌ Public subdomain hosting and artifact rendering
- ❌ Real-time collaboration and versioning
- ❌ Asset management and content moderation

### Studio Features
- ✅ Modern shadcn/ui interface with dark theme
- ✅ ChatGPT-like conversation interface
- ✅ Real-time artifact preview capabilities
- ❌ vhybZ library integration
- ❌ Backend API communication
- ❌ Collaboration features

## Development Guidelines

### Server Environment
- **Backend commands**: Use `deno task` commands only
- **Dependencies**: JSR imports in deno.json
- **Runtime**: Deno with Fresh framework
- **Never use npm commands** in server directory

### Studio Environment
- **Frontend commands**: Use standard `npm` commands  
- **Dependencies**: npm packages in package.json
- **Runtime**: Node.js with React and Vite
- **Never use deno commands** in studio directory

### Command Examples
```bash
# Server directory (Backend)
cd server/
deno task dev          # Start backend server
deno task check        # Lint and type check backend

# Studio directory (Frontend) 
cd studio/
npm run dev           # Start React dev server
npm run build         # Build React app
npm run lint          # Lint React code
```

## Project Context and History

This monorepo was created by merging two repositories:
- **server/** (formerly deno-vhybZ): Deno backend with Fresh framework
- **studio/** (formerly web-vhybZ): React frontend with shadcn/ui interface

See **PRD.md** for comprehensive feature requirements, **AGENTS.md** for detailed system architecture specifications, and **DIARY.md** for historical changes and decisions.

The platform enables "vibe coding for the masses" - allowing creators to build interactive digital artifacts through natural language conversations without requiring coding skills.