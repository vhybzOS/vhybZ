# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Always Check DIARY.md
- **Read DIARY.md first** on each startup to understand project history and recent changes
- **Update DIARY.md** with a timestamped entry for every change you make
- Include change type, description, rationale, and files modified in each entry

## Development Commands

### Core Development
- `deno task dev` - Start development server (builds React app and runs Deno backend)
- `deno task dev:react` - Run React app in development mode only
- `deno task build` - Build the application for production
- `deno task start` - Run production server
- `deno task check` - Run all checks (format, lint, type checking)
- `deno task update` - Update Fresh framework

### Quality Assurance
Before committing changes, always run:
- `deno task check` - Validates formatting, linting, and type checking

### Development Environment Separation

#### Backend (Root Directory) - Use Deno
- **Backend commands**: Use `deno task` commands only
- **Dependencies**: JSR imports in deno.json
- **Runtime**: Deno with Fresh framework
- **Never use npm commands** in the root directory

#### Frontend (web-vhybZ/) - Use Node.js
- **Frontend commands**: Use standard `npm` commands  
- **Dependencies**: npm packages in package.json
- **Runtime**: Node.js with React Router 7
- **Never use deno commands** in web-vhybZ directory

#### Command Examples
```bash
# Root directory (Backend)
deno task dev          # Start backend server
deno task check        # Lint and type check backend

# web-vhybZ directory (Frontend) 
npm run dev           # Start React dev server
npm run build         # Build React app
npm run lint          # Lint React code
```

## Architecture Overview

This is a **Fresh 2.0** web application using Deno with the following key architectural components:

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

### Environment Setup
Required environment variables:
- `MONGODB_URI` (defaults to local MongoDB)
- `MONGODB_DB_NAME` (defaults to "vhybZ")
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` for OAuth

### Project Context
This is the backend for vhybZ, an AI-powered platform for building interactive digital artifacts through natural language conversations. The platform serves multiple clients and hosts user-generated artifacts on custom subdomains.

#### Multi-Client Architecture
- **Backend API**: Deno/Fresh backend (this repo: https://github.com/vhybzOS/deno-vhybZ)
- **Generation Library**: Core AI/LLM logic (repo: https://github.com/vhybzOS/vhybZ)
- **Web Frontend**: React app at `vhybz.com` (repo: https://github.com/vhybzOS/web-vhybZ)
- **Mobile App**: React Native app (repo: https://github.com/vhybzOS/RN-vhybZ)
- **Artifact Hosting**: Custom subdomains at `username.vhybz.com/artifact-name`

#### Core Product Flow (Backend's Role)
1. Users authenticate via backend Google OAuth
2. **Frontend** imports **vhybZ library** for ChatGPT-like interface and LLM calls
3. **vhybZ library** generates interactive HTML artifacts with real-time preview
4. **Backend** stores artifacts sent by frontend ("vibe coding" logic in vhybZ library)
5. **Backend** serves final artifacts on custom URLs for public sharing

#### Architecture Separation
- **Backend (This Repo)**: Data store, authentication, public hosting, analytics
- **vhybZ Library**: LLM interactions, HTML generation, real-time preview logic
- **Frontend Clients**: UI layer, imports vhybZ library for functionality

#### Current Implementation Status
- ✅ Basic auth, user management, and app CRUD
- ❌ Conversation and artifact storage APIs  
- ❌ Public subdomain hosting and artifact rendering
- ❌ Real-time collaboration and versioning
- ❌ Asset management and content moderation

See **PRD.md** for comprehensive feature requirements and **AGENTS.md** for detailed system architecture specifications.