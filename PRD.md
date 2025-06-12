# Product Requirements Document (PRD) - vhybZ Platform

## Overview

vhybZ is an AI-powered platform that enables creators to build interactive digital artifacts through natural language conversations, eliminating the need for coding skills. This PRD outlines the features required for the complete vhybZ ecosystem across both backend (@server/) and frontend (@studio/) components in this monorepo.

## Monorepo Structure

### Platform Architecture
- **@server/** - Deno backend (Fresh 2.0 framework) - Data store and API layer
- **@studio/** - React frontend (Vite + shadcn/ui) - Web interface and user experience
- **vhybZ Core Library** (External): AI logic, LLM integration, SOUL framework (repo: https://github.com/vhybzOS/vhybZ)
- **Mobile Client** (Future): React Native app (repo: https://github.com/vhybzOS/RN-vhybZ)

### Separation of Concerns

**@server/ (Backend)**:
- **Role**: Data store and API layer
- **Responsibilities**: User management, artifact storage, authentication, analytics, public hosting
- **Does NOT handle**: AI/LLM interactions, HTML generation, real-time preview logic

**@studio/ (Frontend)**:
- **Role**: Web interface and vhybZ library integration
- **Responsibilities**: React UI layer, user experience, vhybZ library orchestration, state management
- **Integration**: Imports vhybZ library for core functionality, communicates with @server/ for data persistence

**vhybZ Core Library**:
- **Repository**: https://github.com/vhybzOS/vhybZ
- **Responsibilities**: LLM API calls, HTML generation, real-time preview, SOUL framework, Confidant

**Artifact Hosting**: Custom subdomains at `username.vhybz.com/artifact-name` (served by @server/)

### Core User Flow
1. User authenticates via Google OAuth (@server/)
2. @studio/ imports vhybZ library and presents ChatGPT-like interface 
3. User describes desired artifact in natural language
4. **vhybZ library** calls LLM APIs and generates HTML artifact with real-time preview
5. **vhybZ library** sends generated artifact to **@server/** for storage
6. User iterates with prompts to refine artifact (vhybZ library handles LLM calls)
7. Final artifact published via @server/ to custom URL for sharing

## Backend Features (@server/)

### Current State Analysis

#### Implemented Features ✅
- Google OAuth authentication
- Basic user and app collections in MongoDB
- Session management with HTTP-only cookies
- Fresh 2.0 framework with Deno runtime
- Basic middleware architecture

#### Missing Critical Features ❌

### 1. Conversation & Artifact Storage

**Priority**: P0 (Blocker for core functionality)

#### Chat Conversation API
```
POST /api/conversations
GET /api/conversations/:id
POST /api/conversations/:id/messages
PUT /api/conversations/:id
DELETE /api/conversations/:id
```

**Requirements**:
- Store conversation history and metadata (frontend sends conversation data)
- Support message threading and branching
- Conversation CRUD operations
- User association and privacy controls
- Search and filtering of conversation history

#### Artifact Storage Service
```
POST /api/artifacts (frontend sends generated HTML)
PUT /api/artifacts/:id (frontend sends updated HTML)
GET /api/artifacts/:id
DELETE /api/artifacts/:id
```

**Requirements**:
- Store artifact HTML/CSS/JS content received from @studio/
- Artifact metadata management (title, description, tags)
- Version history and snapshots
- Content validation and sanitization
- File size limits and optimization

**Database Schema Additions**:
```javascript
// Conversations Collection
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  artifactId: ObjectId?,
  createdAt: Date,
  updatedAt: Date
}

// Messages Collection
{
  _id: ObjectId,
  conversationId: ObjectId,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Object,
  createdAt: Date
}

// Artifact Versions Collection
{
  _id: ObjectId,
  artifactId: ObjectId,
  version: number,
  content: string,
  generationPrompt: string,
  createdAt: Date
}
```

### 2. Enhanced Artifact Management

**Priority**: P0

#### Versioning System
```
GET /api/artifacts/:id/versions
POST /api/artifacts/:id/versions
PUT /api/artifacts/:id/versions/:version/restore
```

**Requirements**:
- Track all iterations during creation process
- Support rollback to previous versions
- Version diffing and comparison
- Branching for experimental changes

#### Artifact Publishing
```
POST /api/artifacts/:id/publish
PUT /api/artifacts/:id/settings
GET /api/artifacts/:id/analytics
```

**Requirements**:
- Slug generation for URLs
- SEO metadata management
- Privacy settings (public/private/unlisted)
- Custom domain support

### 3. Public Artifact Hosting

**Priority**: P0

#### Subdomain Routing
```
GET /:username/:artifactSlug (on subdomains)
GET /api/public/:username/:artifactSlug
```

**Requirements**:
- Dynamic subdomain routing (`username.vhybz.com`)
- SSL certificate automation (Let's Encrypt)
- CDN integration for performance
- Mobile-responsive artifact rendering

#### Social Sharing
```
GET /api/artifacts/:id/embed
POST /api/artifacts/:id/share
```

**Requirements**:
- Open Graph meta tags generation
- Twitter Card support
- Embeddable iframe generation
- Social media preview images

### 4. Additional Backend Features (P1-P2)

- Asset Management System (file uploads, CDN integration)
- Real-time Collaboration (WebSocket infrastructure)
- Analytics & Insights (usage metrics, creator dashboard)
- Content Moderation (automated scanning, reporting)
- Enhanced Security (MFA, API keys, GDPR compliance)

## Frontend Features (@studio/)

### Current State Analysis

#### Implemented Features ✅
- Modern shadcn/ui interface with dark theme
- ChatGPT-like conversation interface foundation
- Real-time artifact preview capabilities (iframe-based)
- Responsive design with Tailwind CSS
- TypeScript integration with React 19.1.0

#### Missing Critical Features ❌

### 1. Authentication & User Management

**Priority**: P0

#### Google OAuth Integration
- **Single Sign-On**: Seamless login via Google OAuth through @server/ API
- **Session Management**: Persistent authentication state across browser sessions
- **Token Handling**: Secure storage and automatic refresh of authentication tokens
- **User Profile**: Display user information and preferences

#### Requirements
```typescript
interface AuthFeatures {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
  refreshToken: () => Promise<string>;
  handleAuthCallback: (code: string) => Promise<void>;
}
```

### 2. ChatGPT-like Conversation Interface

**Priority**: P0

#### Real-time Conversation Flow
- **Message Input**: Rich text input with support for multimodal content
- **Streaming Responses**: Real-time display of AI responses during generation
- **Conversation History**: Persistent chat history with search and filtering
- **Context Awareness**: Maintain conversation context across interactions

#### UI Components
```typescript
interface ConversationComponents {
  MessageList: React.FC<{ messages: Message[] }>;
  MessageInput: React.FC<{ onSubmit: (message: string) => void }>;
  StreamingIndicator: React.FC<{ isStreaming: boolean }>;
  ConversationSidebar: React.FC<{ conversations: Conversation[] }>;
}
```

#### Requirements
- **Performance**: Handle 1000+ messages in conversation without lag
- **Responsiveness**: Mobile-optimized layout with touch-friendly interactions
- **Accessibility**: Screen reader support and keyboard navigation
- **Search**: Full-text search across conversation history

### 3. Artifact Creation & Preview

**Priority**: P0

#### Real-time Generation Experience
- **Live Preview**: Sandboxed iframe showing artifact as it's generated
- **Progress Indicators**: Visual feedback during generation process
- **Error Handling**: Graceful degradation for generation failures
- **Iteration Support**: Easy refinement through follow-up prompts

#### Artifact Management
```typescript
interface ArtifactManagement {
  createArtifact: (prompt: string) => Promise<Artifact>;
  refineArtifact: (id: string, prompt: string) => Promise<Artifact>;
  saveArtifact: (artifact: Artifact) => Promise<string>;
  shareArtifact: (id: string) => Promise<string>;
  duplicateArtifact: (id: string) => Promise<Artifact>;
}
```

#### Security Features
- **Content Sanitization**: XSS prevention for user-generated content
- **Sandboxed Execution**: Isolated environment for artifact preview
- **CSP Headers**: Content Security Policy enforcement
- **Input Validation**: Server-side validation for all user inputs

### 4. Dashboard & Gallery

**Priority**: P1

#### User Dashboard
- **Artifact Gallery**: Grid/list view of user's created artifacts
- **Quick Actions**: Create new, duplicate, share, delete artifacts
- **Search & Filter**: Find artifacts by title, type, date, or content
- **Sorting Options**: Recently created, most viewed, alphabetical
- **Bulk Operations**: Select multiple artifacts for batch actions

#### Analytics & Insights
```typescript
interface DashboardAnalytics {
  getArtifactStats: () => Promise<ArtifactStats>;
  getUsageMetrics: () => Promise<UsageMetrics>;
  getPopularArtifacts: () => Promise<Artifact[]>;
  getCollaborationActivity: () => Promise<ActivityLog[]>;
}
```

### 5. vhybZ Library Integration

**Priority**: P0

#### Core Library Usage
```typescript
interface VhybZIntegration {
  initializeGenerator: (config: GeneratorConfig) => VhybZGenerator;
  createArtifact: (options: CreateOptions) => Promise<Artifact>;
  streamGeneration: (options: StreamOptions) => AsyncIterable<Update>;
  manageSoulAgents: () => SOULAgentManager;
  handleConfidant: () => ConfidantBridge;
}
```

#### SOUL Agent Integration
- **Agent Management**: Create and configure AI agents
- **Proactive Assistance**: Agents suggest improvements and next steps
- **Learning Adaptation**: Agents learn from user preferences and patterns
- **Multi-Agent Coordination**: Multiple agents working together

#### Error Handling & Fallbacks
- **LLM Provider Failures**: Graceful fallback to alternative providers
- **Network Issues**: Offline queue for pending operations
- **Rate Limiting**: Respectful handling of API rate limits
- **Timeout Management**: Configurable timeouts with user feedback

### 6. Additional Frontend Features (P1-P2)

- Collaboration Features (real-time editing, comments, version control)
- Performance & Optimization (code splitting, caching, PWA support)
- Responsive Design & Accessibility (WCAG 2.1 AA compliance)
- Advanced Editor Features (syntax highlighting, autocomplete)

## Technical Implementation

### @server/ Technology Stack
- **Runtime**: Deno 1.40+
- **Framework**: Fresh 2.0
- **Database**: MongoDB with Zod validation
- **Authentication**: Google OAuth 2.0
- **Package Management**: JSR (JavaScript Registry)

### @studio/ Technology Stack
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 with optimized bundling
- **UI Library**: shadcn/ui with Tailwind CSS
- **State Management**: React Context + useReducer pattern
- **Routing**: React Router v6 with lazy loading
- **Testing**: Vitest + React Testing Library

### API Integration Patterns
```typescript
// Backend API client (@studio/ ↔ @server/)
class APIClient {
  private baseURL: string;
  private token: string | null = null;
  
  async request<T>(endpoint: string, options?: RequestInit): Promise<T>;
  async saveArtifact(artifact: Artifact): Promise<string>;
  async getArtifacts(): Promise<Artifact[]>;
  async saveConversation(conversation: Conversation): Promise<string>;
}

// vhybZ Library wrapper (@studio/ ↔ vhybZ Library)
class VhybZService {
  private generator: VhybZGenerator;
  
  async createArtifact(options: CreateOptions): Promise<Artifact>;
  async refineArtifact(id: string, prompt: string): Promise<Artifact>;
  streamGeneration(options: StreamOptions): AsyncIterable<Update>;
}
```

## Database Schema Extensions

### New Collections Required

```javascript
// Conversations
{
  _id: ObjectId,
  userId: ObjectId,
  title: string,
  artifactId: ObjectId?,
  createdAt: Date,
  updatedAt: Date
}

// Messages  
{
  _id: ObjectId,
  conversationId: ObjectId,
  role: 'user' | 'assistant' | 'system',
  content: string,
  metadata: Object,
  createdAt: Date
}

// ArtifactVersions
{
  _id: ObjectId,
  artifactId: ObjectId,
  version: number,
  content: string,
  generationPrompt: string,
  createdAt: Date
}

// Assets
{
  _id: ObjectId,
  userId: ObjectId,
  filename: string,
  mimeType: string,
  size: number,
  url: string,
  metadata: Object,
  createdAt: Date
}

// Analytics
{
  _id: ObjectId,
  artifactId: ObjectId,
  event: string,
  userId: ObjectId?,
  metadata: Object,
  timestamp: Date
}

// Collaborators
{
  _id: ObjectId,
  artifactId: ObjectId,
  userId: ObjectId,
  role: 'viewer' | 'commenter' | 'editor' | 'admin',
  invitedBy: ObjectId,
  createdAt: Date
}
```

### Apps Collection Updates

```javascript
// Extended Apps/Artifacts schema
{
  _id: ObjectId,
  userId: ObjectId,
  name: string,
  slug: string, // URL-friendly identifier
  content: string,
  currentVersion: number,
  status: 'draft' | 'published' | 'archived',
  visibility: 'public' | 'private' | 'unlisted',
  subdomain: string?, // Custom subdomain
  seoMetadata: {
    title: string,
    description: string,
    image: string?,
    keywords: [string]
  },
  collaborationSettings: {
    allowComments: boolean,
    allowCollaboration: boolean,
    publicEdit: boolean
  },
  analytics: {
    viewCount: number,
    likeCount: number,
    shareCount: number
  },
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date?
}
```

## User Experience Flow

### Onboarding Experience (@studio/)
1. **Landing Page**: Introduction to vhybZ platform capabilities
2. **Authentication**: One-click Google OAuth sign-in via @server/
3. **Welcome Tour**: Interactive tutorial showing key features
4. **First Artifact**: Guided creation of first artifact
5. **Dashboard**: Introduction to artifact gallery and management

### Core Creation Flow (@studio/ + vhybZ Library)
1. **Start Conversation**: Click "Create New" or use existing conversation
2. **Describe Artifact**: Type natural language description
3. **Real-time Generation**: Watch artifact appear in preview (vhybZ library)
4. **Iterate & Refine**: Make adjustments through follow-up prompts
5. **Save & Share**: Save final artifact to @server/ and generate sharing link

### Collaboration Flow (@studio/ + @server/)
1. **Invite Collaborators**: Share artifact with email invitations
2. **Real-time Editing**: Simultaneous editing with live presence
3. **Comment & Review**: Add comments and feedback
4. **Version Management**: Track changes and revert if needed
5. **Publish Together**: Collaborative publishing and sharing

## Implementation Roadmap

### Phase 1: Core Foundation (Weeks 1-8)
**@server/**:
- Conversation and artifact storage APIs
- Enhanced artifact management with versioning
- Public artifact hosting with subdomain routing
- Basic analytics implementation

**@studio/**:
- Authentication and user management
- Basic conversation interface
- Artifact creation and preview
- vhybZ library integration
- Dashboard and gallery

### Phase 2: Collaboration & Enhancement (Weeks 9-16)  
**@server/**:
- Real-time collaboration features (WebSockets)
- Asset management system
- Social sharing and engagement features
- Content moderation system

**@studio/**:
- Real-time collaboration features
- Sharing and permissions
- Comments and reviews
- Version history
- Advanced artifact management

### Phase 3: Platform & Scale (Weeks 17-24)
**@server/**:
- Advanced analytics and insights
- Enhanced security and compliance
- Performance optimization
- Production deployment

**@studio/**:
- SOUL agent integration
- Advanced search and filtering
- Performance optimization
- Accessibility improvements
- Mobile responsiveness

## Success Metrics

### Technical Performance
- **@server/**: < 200ms for artifact CRUD operations, < 2s page load globally
- **@studio/**: < 3s initial load, < 500ms route navigation, < 100MB memory usage
- **Platform**: Support 100K+ concurrent users, 1M+ artifacts hosted

### User Experience
- **Time to First Artifact**: < 5 minutes for new users
- **Generation Success Rate**: > 95% successful artifact generations
- **User Retention**: > 70% weekly active users return monthly
- **Feature Adoption**: > 80% users try collaboration features within first week

### Business Impact
- **User Engagement**: Average 20+ minutes per session
- **Artifact Creation**: 5+ artifacts created per user per month
- **Sharing Rate**: 60% of artifacts shared publicly or with collaborators
- **Platform Growth**: 10K+ daily active creators

## Risk Mitigation

### Technical Risks
- **vhybZ Library Integration**: Implement robust error handling and fallbacks in @studio/
- **Performance Problems**: Continuous monitoring and optimization across both @server/ and @studio/
- **Security Vulnerabilities**: Regular security audits and updates for both components
- **Monorepo Complexity**: Clear separation of concerns and development guidelines

### User Experience Risks
- **Complexity**: User testing and iterative UI improvements in @studio/
- **Learning Curve**: Interactive tutorials and progressive disclosure
- **Performance Expectations**: Clear loading states and progress indicators
- **Cross-Component Integration**: Seamless integration between @server/ and @studio/

This monorepo approach enables rapid development while maintaining clear separation of concerns between the backend API (@server/) and frontend interface (@studio/), working together to provide a comprehensive platform for AI-powered artifact creation.

## Cross-Repository Links

- **vhybZ Core Library**: https://github.com/vhybzOS/vhybZ/blob/main/PRD.md
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ/blob/main/PRD.md
- **Platform Architecture**: See AGENTS.md in this repository