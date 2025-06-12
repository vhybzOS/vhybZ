# vhybZ - System Architecture & Design

## Overview

vhybZ is an AI-powered platform designed to help creators easily build and share interactive digital artifacts. This document outlines the system architecture, design decisions, and implementation details for the vhybZ backend and frontend components in this monorepo.

## Monorepo Architecture

### Repository Structure
This monorepo contains:
- **@server/** - Deno backend (Fresh 2.0 framework)
- **@studio/** - React frontend (Vite + shadcn/ui)
- **vhybZ Library** (External): Core AI/LLM logic (repo: https://github.com/vhybzOS/vhybZ)
- **Mobile App** (Future): React Native app (repo: https://github.com/vhybzOS/RN-vhybZ)

### Platform Integration
- **@server/**: Data store, authentication, public hosting, analytics, artifact serving
- **@studio/**: React UI layer, user experience, vhybZ library integration
- **vhybZ Library**: LLM interactions, HTML generation, real-time preview logic
- **Artifact Hosting**: Custom subdomains at `username.vhybz.com/artifact-name`

## User Journey

1. **Authentication**
   - User logs in via Google OAuth (handled by @server/)
   - Session established via secure, HTTP-only cookies

2. **Artifact Creation**
   - @studio/ presents ChatGPT-like interface
   - User describes desired artifact in natural language
   - vhybZ library generates interactive HTML artifact
   - Artifact previews in real-time within @studio/

3. **Iteration**
   - User provides feedback or new prompts in @studio/
   - vhybZ library refines artifact iteratively
   - Changes appear instantly in the @studio/ preview

4. **Publishing**
   - User saves final artifact via @studio/
   - @server/ assigns URL: `username.vhybz.com/ArtifactName-slug`
   - Artifact becomes publicly accessible via @server/

5. **Sharing**
   - User copies shareable link from @studio/
   - Others can view but not edit the artifact via @server/

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
   - Separate clients for web (@studio/) and mobile ensure optimal UX
   - Central backend (@server/) handles authentication and artifact storage
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

## Server Architecture (@server/)

**Role**: Data store and API layer (does NOT handle AI/LLM interactions)

### Technology Stack
- **Runtime**: Deno 1.40+
- **Web Framework**: Fresh 2.0
- **Database**: MongoDB
- **Authentication**: Google OAuth 2.0
- **Package Management**: JSR (JavaScript Registry)
- **Deployment**: Deno Deploy (planned)

### Separation of Concerns
- **@server/ Responsibilities**: User management, artifact storage, authentication, analytics, public hosting
- **vhybZ Library Responsibilities**: LLM API calls, HTML generation, real-time preview logic
- **@studio/ Responsibilities**: UI layer, imports vhybZ library for core functionality

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

**Note**: @server/ does NOT generate artifacts or call LLMs - it only stores data sent by @studio/ clients.

## Studio Architecture (@studio/)

**Role**: Web interface and vhybZ library integration

### Technology Stack
- **Framework**: React 19.1.0 with TypeScript for type safety
- **Build System**: Vite 6.3.5 with hot module replacement and fast builds
- **UI Framework**: shadcn/ui with Tailwind CSS (migrated from Material-UI)
- **State Management**: React Context + Hooks pattern
- **Routing**: React Router for single-page application navigation
- **Development**: ESLint with React-specific rules and best practices

### Application Structure
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Shared components (Button, Modal, etc.)
│   ├── chat/           # Chat interface components
│   ├── artifacts/      # Artifact display and interaction
│   └── layout/         # Layout and navigation components
├── pages/              # Route-based page components
│   ├── Dashboard/      # User dashboard and artifact gallery
│   ├── Create/         # Artifact creation interface
│   ├── Collaborate/    # Real-time collaboration features
│   └── Profile/        # User profile and settings
├── hooks/              # Custom React hooks
│   ├── useAuth.ts      # Authentication state management
│   ├── useArtifacts.ts # Artifact CRUD operations
│   └── useVhybZ.ts     # vhybZ library integration
├── services/           # External service integrations
│   ├── api.ts          # Backend API client (@server/ integration)
│   ├── vhybz.ts        # vhybZ library wrapper
│   └── auth.ts         # Authentication service
├── utils/              # Shared utilities and helpers
├── types/              # TypeScript type definitions
├── contexts/           # React Context providers
└── styles/             # Global styles and shadcn/ui themes
```

## Core Features Implementation

### 1. ChatGPT-like Interface (@studio/)

#### Conversation Component Architecture
```typescript
interface ConversationProps {
  conversationId?: string;
  onArtifactGenerated: (artifact: Artifact) => void;
}

const Conversation: React.FC<ConversationProps> = ({ 
  conversationId, 
  onArtifactGenerated 
}) => {
  const { createArtifact, isGenerating } = useVhybZ();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  
  const handleSubmit = async (prompt: string) => {
    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const artifact = await createArtifact({
        prompt,
        conversationId,
        onUpdate: (update) => {
          // Show real-time generation progress
          setStreamingContent(update.html);
        }
      });
      
      const assistantMessage = { 
        role: 'assistant', 
        content: 'Artifact created successfully',
        artifact 
      };
      setMessages(prev => [...prev, assistantMessage]);
      onArtifactGenerated(artifact);
    } catch (error) {
      // Handle generation errors gracefully
      showErrorMessage(error.message);
    }
  };
  
  return (
    <ChatContainer>
      <MessageList messages={messages} />
      <MessageInput 
        value={inputValue}
        onChange={setInputValue}
        onSubmit={handleSubmit}
        disabled={isGenerating}
        placeholder="Describe the artifact you want to create..."
      />
    </ChatContainer>
  );
};
```

### 2. Real-time Artifact Preview (@studio/)

#### Sandboxed Preview Component
```typescript
interface ArtifactPreviewProps {
  content: string;
  isLoading?: boolean;
  onError?: (error: Error) => void;
}

const ArtifactPreview: React.FC<ArtifactPreviewProps> = ({ 
  content, 
  isLoading, 
  onError 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!iframeRef.current || !content) return;
    
    try {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (doc) {
        // Clear previous content
        doc.open();
        
        // Inject security headers and sanitized content
        const sanitizedContent = sanitizeHTML(content);
        const wrappedContent = wrapWithSecurity(sanitizedContent);
        
        doc.write(wrappedContent);
        doc.close();
        
        setPreviewError(null);
      }
    } catch (error) {
      setPreviewError(error.message);
      onError?.(error);
    }
  }, [content, onError]);
  
  if (isLoading) {
    return <PreviewSkeleton />;
  }
  
  if (previewError) {
    return <PreviewError message={previewError} />;
  }
  
  return (
    <PreviewContainer>
      <iframe
        ref={iframeRef}
        sandbox="allow-scripts allow-same-origin allow-forms"
        title="Artifact Preview"
        style={{ 
          width: '100%', 
          height: '100%', 
          border: 'none',
          borderRadius: '8px'
        }}
      />
    </PreviewContainer>
  );
};
```

### 3. vhybZ Library Integration (@studio/)

#### Custom Hook for Library Integration
```typescript
const useVhybZ = () => {
  const { user, token } = useAuth();
  const [generator] = useState(() => {
    return new VhybZGenerator({
      apiEndpoint: process.env.REACT_APP_API_URL,
      authToken: token,
      clientType: 'web',
      options: {
        enableStreaming: true,
        enableSOUL: true,
        maxConcurrentGenerations: 3
      }
    });
  });
  
  const createArtifact = useCallback(async (options: {
    prompt: string;
    conversationId?: string;
    onUpdate?: (update: ArtifactUpdate) => void;
  }) => {
    return await generator.createArtifact({
      ...options,
      userContext: {
        userId: user?.id,
        preferences: user?.preferences,
        subscription: user?.subscription
      }
    });
  }, [generator, user]);
  
  const refineArtifact = useCallback(async (
    artifactId: string,
    refinementPrompt: string
  ) => {
    return await generator.refineArtifact(artifactId, refinementPrompt);
  }, [generator]);
  
  return {
    createArtifact,
    refineArtifact,
    isGenerating: generator.isGenerating,
    supportedTypes: generator.getSupportedArtifactTypes()
  };
};
```

### 4. Backend API Integration (@studio/ ↔ @server/)

#### API Client Service
```typescript
class BackendAPIClient {
  private baseURL: string;
  private token: string | null = null;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  setAuthToken(token: string) {
    this.token = token;
  }
  
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers
    };
    
    const response = await fetch(url, { ...options, headers });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Artifact Management
  async saveArtifact(artifact: Artifact): Promise<string> {
    const result = await this.request<{ id: string }>('/api/artifacts', {
      method: 'POST',
      body: JSON.stringify(artifact)
    });
    return result.id;
  }
  
  async getArtifacts(): Promise<Artifact[]> {
    return this.request<Artifact[]>('/api/artifacts');
  }
  
  async updateArtifact(id: string, changes: Partial<Artifact>): Promise<void> {
    await this.request(`/api/artifacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(changes)
    });
  }
  
  // Conversation Management
  async saveConversation(conversation: Conversation): Promise<string> {
    const result = await this.request<{ id: string }>('/api/conversations', {
      method: 'POST',
      body: JSON.stringify(conversation)
    });
    return result.id;
  }
  
  async getConversations(): Promise<Conversation[]> {
    return this.request<Conversation[]>('/api/conversations');
  }
}
```

## Development Setup

### Prerequisites
- Deno 1.40+
- Node.js 18+ (for @studio/)
- MongoDB (local or Atlas)
- Google OAuth credentials

### Environment Variables
```
# @server/ environment
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=vhybZ
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# @studio/ environment
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ENVIRONMENT=development
```

### Running Locally
```bash
# Start @server/ (from server/ directory)
cd server/
deno task dev

# Start @studio/ (from studio/ directory)
cd studio/
npm run dev

# Or use monorepo approach
# @server/ can be configured to also build and serve @studio/
```

### CRITICAL: Command Separation
- **@server/**: Always use `deno` commands
- **@studio/**: Always use `npm` commands
- **NEVER mix**: Don't use npm in server/ or deno in studio/

## Future Improvements

### @server/ Enhancements
- [ ] Rate limiting
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Real-time collaboration (WebSockets)
- [ ] File uploads (S3/GCS)
- [ ] Analytics and monitoring

### @studio/ Enhancements
- [ ] Progressive Web App (PWA) support
- [ ] Offline capabilities
- [ ] Advanced editor features
- [ ] Social features (likes, comments)
- [ ] Performance optimization

### Platform Integration
- [ ] SOUL Agent management
- [ ] Confidant bridge integration
- [ ] Multi-agent coordination
- [ ] Cross-device synchronization

## Security Considerations
- All routes are protected by default in @server/
- CSRF protection for forms
- Rate limiting for public endpoints
- Input validation on all endpoints in @server/
- Secure session management
- Content sanitization in @studio/
- Sandboxed artifact preview in @studio/

## Monitoring & Observability
- Error tracking (Sentry/LogRocket)
- Performance monitoring
- Usage analytics
- Infrastructure monitoring

## Cross-Repository Integration

This monorepo integrates with the broader vhybZ ecosystem:

- **vhybZ Core Library**: Used by @studio/ for AI functionality
- **Backend API**: @studio/ authenticates and persists data via @server/
- **Mobile App**: Shares design patterns and user experience
- **Platform Vision**: Enables "vibe coding for the masses" across all clients

## Contributing
1. Fork the repository
2. Create a feature branch
3. Submit a pull request
4. Ensure all tests pass in both @server/ and @studio/

## License
MIT

---
Last Updated: December 2025