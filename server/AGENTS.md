# vhybZ - System Architecture & Design

## Overview
vhybZ is an AI-powered platform designed to help creators easily build and share interactive digital artifacts. This document outlines the system architecture, design decisions, and implementation details for the vhybZ backend and frontend components.

## User Journey

1. **Authentication**
   - User logs in via Google OAuth
   - Session established via secure, HTTP-only cookies

2. **Artifact Creation**
   - Presents with a ChatGPT-like interface
   - User describes desired artifact in natural language
   - System generates interactive HTML artifact
   - Artifact previews in real-time

3. **Iteration**
   - User provides feedback or new prompts
   - System refines artifact iteratively
   - Changes appear instantly in the preview

4. **Publishing**
   - User saves final artifact
   - System assigns URL: `username.vhybz.com/ArtifactName-slug`
   - Artifact becomes publicly accessible

5. **Sharing**
   - User copies shareable link
   - Others can view but not edit the artifact

### Design Rationale
Based on user interviews, we chose this design because:

1. **For Creators**
   - Eliminates technical barriers (no coding required)
   - Natural language interface feels familiar (ChatGPT-like)
   - Instant visual feedback reduces iteration time
   - Professional hosting with custom URLs

2. **For Viewers**
   - Clean, dedicated URLs for sharing
   - No login required to view artifacts
   - Mobile-responsive viewing experience

3. **Technical Foundation**
   - Separate clients for web and mobile ensure optimal UX
   - Central backend handles authentication and artifact storage
   - Subdomain-based routing for user content

4. **Key Differentiators**
   - Focus on visual artifacts, not just text
   - Iterative refinement through conversation
   - Professional presentation without technical complexity

This design directly addresses the core needs identified in user interviews, particularly the desire for:
- Faster content creation (Mani, Termeh)
- Professional presentation (Julien, Hastia)
- Easy sharing and showcasing (all users)
- No technical expertise required (Hastia, Termeh)

## Backend Architecture

**Role**: Data store and API layer (does NOT handle AI/LLM interactions)

### Technology Stack
- **Runtime**: Deno 1.40+
- **Web Framework**: Fresh 2.0
- **Database**: MongoDB
- **Authentication**: Google OAuth 2.0
- **Package Management**: JSR (JavaScript Registry)
- **Deployment**: Deno Deploy (planned)

### Separation of Concerns
- **Backend Responsibilities**: User management, artifact storage, authentication, analytics, public hosting
- **vhybZ Library Responsibilities**: LLM API calls, HTML generation, real-time preview logic
- **Frontend Responsibilities**: UI layer, imports vhybZ library for core functionality

### Database Design (`database.ts`)

#### Collections
1. **Users**
   - `_id`: ObjectId (MongoDB)
   - `googleId`: string (Google's unique ID)
   - `email`: string (User's email)
   - `name`: string (User's display name)
   - `avatar`: string? (URL to user's avatar)
   - `createdAt`: Date
   - `updatedAt`: Date

2. **Apps**
   - `_id`: ObjectId (MongoDB)
   - `userId`: ObjectId (Reference to Users._id)
   - `name`: string (App/Artifact name)
   - `content`: string (Serialized content/configuration)
   - `createdAt`: Date
   - `updatedAt`: Date

#### Design Decisions
- **Schema Validation**: Uses Zod for robust runtime type checking and validation
- **Connection Management**: Implements singleton pattern for database connection
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Environment Variables**: Centralized configuration with sensible defaults

### API Design (`main.ts`)

#### Authentication Flow
1. **Google OAuth 2.0 Integration**
   - `/auth/google` - Initiates OAuth flow
   - `/auth/google/callback` - Handles OAuth callback and session creation
   - Uses secure, HTTP-only cookies for session management

#### Middleware
1. **Session Middleware**
   - Parses session cookies
   - Attaches user session to request context

2. **Auth Middleware**
   - Protects routes requiring authentication
   - Returns 401 for unauthenticated requests

#### API Endpoints (Data Storage Only)
- `GET /api/me` - Get current user profile (protected)
- `GET /api/conversations` - List user's conversations (protected)
- `POST /api/conversations` - Store conversation data from frontend (protected)
- `GET /api/artifacts` - List user's artifacts (protected)
- `POST /api/artifacts` - Store artifact HTML from frontend (protected)
- `PUT /api/artifacts/:id` - Update artifact with new HTML from frontend (protected)
- `GET /api/artifacts/:id` - Get artifact details (public/private based on settings)
- `POST /auth/logout` - Logout user

**Note**: Backend does NOT generate artifacts or call LLMs - it only stores data sent by frontend clients.

## Architecture Overview

### Repository Structure
1. **Backend API** (this repo): https://github.com/vhybzOS/deno-vhybZ
2. **Core Library**: https://github.com/vhybzOS/vhybZ
3. **Web Client**: https://github.com/vhybzOS/web-vhybZ  
4. **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ

### Core vhybZ Library (https://github.com/vhybzOS/vhybZ)
- **LLM Integration**: Direct API calls to OpenAI, Anthropic, etc.
- **HTML Generation**: Creates artifact HTML/CSS/JS based on LLM responses
- **Real-time Preview**: Shows artifact preview as it's being generated
- **SOUL Framework**: Meta-agents for persistent memory and agency
- **Confidant**: Bridge for physical/digital world interactions

### Frontend Client Responsibilities
- **UI Layer**: User interface components and navigation
- **Library Integration**: Imports and uses vhybZ library for core functionality
- **Data Flow**: Manages state between vhybZ library and backend API

### Backend Integration
- Frontend clients use vhybZ library which calls backend APIs
- Backend stores/retrieves conversations and artifacts from vhybZ library
- Backend serves stored artifacts on public URLs (`username.vhybz.com/artifact-name`)
- Authentication handled by backend, session shared across all clients

## Development Setup

### Prerequisites
- Deno 1.40+
- MongoDB (local or Atlas)
- Google OAuth credentials

### Environment Variables
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=vhybZ
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Running Locally
```bash
# Cache dependencies
deno cache --reload

# Start development server (builds React app and runs backend)
deno task dev

# Or run React app in development mode separately
deno task dev:react

# Run tests (TBD)
deno test
```

### CRITICAL: Deno vs npm Commands
- **This is a Deno project** - Always use `deno` commands at the root level
- **NEVER use npm commands** in the root directory
- For the React app in `web-vhybZ/`: cd into that directory first, then use npm
- Example: `cd web-vhybZ && npm install && npm run build`

## Deployment

### Deno Deploy
1. Set up environment variables in dashboard
2. Connect GitHub repository
3. Deploy main branch

### Database
- Production: MongoDB Atlas
- Development: Local MongoDB instance

## Future Improvements

### Backend
- [ ] Rate limiting
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Real-time collaboration
- [ ] File uploads (S3/GCS)
- [ ] Analytics

### Frontend
- [ ] Progressive Web App (PWA) support
- [ ] Offline capabilities
- [ ] Advanced editor features
- [ ] Social features (likes, comments)

## Security Considerations
- All routes are protected by default
- CSRF protection for forms
- Rate limiting for public endpoints
- Input validation on all endpoints
- Secure session management
- Environment-based configuration

## Monitoring & Observability
- Error tracking (Sentry/LogRocket)
- Performance monitoring
- Usage analytics

## Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License
MIT

---
Last Updated: June 2024
