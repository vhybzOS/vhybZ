# vhybZ Web Client - Architecture & Implementation Guide

## Overview

The vhybZ Web Client is a React-based application that provides the primary web interface for the vhybZ platform. It integrates the vhybZ Core Library to enable AI-powered artifact creation through a ChatGPT-like interface with real-time preview capabilities.

## Repository Context

### Platform Architecture
- **Backend API**: https://github.com/vhybzOS/deno-vhybZ (Deno/Fresh data store and authentication)
- **Core Library**: https://github.com/vhybzOS/vhybZ (AI logic, LLM integration, SOUL framework)
- **Web Client**: https://github.com/vhybzOS/web-vhybZ (this repo - React UI)
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ (React Native app)

### Separation of Concerns
- **This Web Client**: React UI layer, user experience, platform-specific features
- **vhybZ Library**: AI/LLM integration, artifact generation, real-time preview logic
- **Backend API**: Data persistence, authentication, public hosting, analytics

## Technical Architecture

### Technology Stack
- **Framework**: React 19.1.0 with TypeScript for type safety
- **Build System**: Vite 6.3.5 with hot module replacement and fast builds
- **UI Framework**: Material-UI 7.1.1 with Emotion for styling and theming
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
│   ├── api.ts          # Backend API client
│   ├── vhybz.ts        # vhybZ library wrapper
│   └── auth.ts         # Authentication service
├── utils/              # Shared utilities and helpers
├── types/              # TypeScript type definitions
├── contexts/           # React Context providers
└── styles/             # Global styles and Material-UI themes
```

## Core Features Implementation

### 1. ChatGPT-like Interface

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

#### Real-time Streaming Implementation
```typescript
const useStreamingGeneration = () => {
  const [streamContent, setStreamContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  
  const handleStream = useCallback((update: ArtifactUpdate) => {
    setStreamContent(prev => {
      // Merge incremental updates
      return mergeHTMLUpdates(prev, update.html);
    });
  }, []);
  
  return {
    streamContent,
    isStreaming,
    handleStream,
    resetStream: () => setStreamContent('')
  };
};
```

### 2. Real-time Artifact Preview

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

#### Content Security Implementation
```typescript
const sanitizeHTML = (html: string): string => {
  // Use DOMPurify or similar for XSS prevention
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'button', 'input'],
    ALLOWED_ATTR: ['class', 'id', 'style', 'onclick', 'onchange'],
    ALLOW_DATA_ATTR: false
  });
};

const wrapWithSecurity = (content: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline';">
      <style>
        body { margin: 0; padding: 16px; font-family: system-ui; }
        * { box-sizing: border-box; }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
};
```

### 3. vhybZ Library Integration

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

#### SOUL Agent Integration
```typescript
const useSOULAgents = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<SOULAgent[]>([]);
  
  const createAgent = useCallback(async (config: {
    name: string;
    role: AgentRole;
    personality?: AgentPersonality;
  }) => {
    const agent = await SOULAgent.create({
      ...config,
      userId: user.id,
      memory: {
        conversationHistory: true,
        artifactHistory: true,
        userPreferences: true
      }
    });
    
    setAgents(prev => [...prev, agent]);
    return agent;
  }, [user]);
  
  const getRecommendations = useCallback(async (context: {
    currentArtifact?: Artifact;
    userGoal?: string;
  }) => {
    const primaryAgent = agents.find(a => a.role === 'primary');
    if (primaryAgent) {
      return await primaryAgent.generateRecommendations(context);
    }
    return [];
  }, [agents]);
  
  return {
    agents,
    createAgent,
    getRecommendations
  };
};
```

### 4. Backend API Integration

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

export const apiClient = new BackendAPIClient(
  process.env.REACT_APP_API_URL || 'http://localhost:8000'
);
```

#### Authentication Integration
```typescript
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing auth on mount
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      setToken(storedToken);
      apiClient.setAuthToken(storedToken);
      fetchCurrentUser();
    } else {
      setIsLoading(false);
    }
  }, []);
  
  const login = useCallback(() => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`;
  }, []);
  
  const logout = useCallback(async () => {
    try {
      await apiClient.request('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth_token');
      apiClient.setAuthToken('');
    }
  }, []);
  
  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await apiClient.request<User>('/api/me');
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);
  
  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };
};
```

## State Management Architecture

### Context Providers
```typescript
// Authentication Context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Artifact Context
const ArtifactContext = createContext<ArtifactContextType | null>(null);

export const ArtifactProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const { createArtifact: vhybzCreate, refineArtifact } = useVhybZ();
  
  const createArtifact = useCallback(async (prompt: string) => {
    const artifact = await vhybzCreate({ prompt });
    const savedId = await apiClient.saveArtifact(artifact);
    const savedArtifact = { ...artifact, id: savedId };
    
    setArtifacts(prev => [savedArtifact, ...prev]);
    setCurrentArtifact(savedArtifact);
    return savedArtifact;
  }, [vhybzCreate]);
  
  return (
    <ArtifactContext.Provider value={{
      artifacts,
      currentArtifact,
      createArtifact,
      refineArtifact,
      setCurrentArtifact
    }}>
      {children}
    </ArtifactContext.Provider>
  );
};
```

## Performance Optimization

### Code Splitting Strategy
```typescript
// Lazy load major route components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ArtifactCreator = lazy(() => import('./pages/ArtifactCreator'));
const Collaboration = lazy(() => import('./pages/Collaboration'));

// Lazy load heavy dependencies
const VhybZGenerator = lazy(() => 
  import('@vhybzOS/vhybZ').then(module => ({ default: module.VhybZGenerator }))
);

// Route-based code splitting
const AppRouter: React.FC = () => (
  <Suspense fallback={<GlobalLoadingSpinner />}>
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/create" element={<ArtifactCreator />} />
      <Route path="/collaborate/:id" element={<Collaboration />} />
    </Routes>
  </Suspense>
);
```

### Memory Management
```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Cleanup vhybZ generator
    generator.cleanup();
    
    // Clear preview content
    setPreviewContent('');
    
    // Cancel pending requests
    abortController.abort();
  };
}, []);

// Memoize expensive operations
const memoizedArtifactList = useMemo(() => {
  return artifacts.filter(artifact => 
    artifact.title.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}, [artifacts, searchQuery]);
```

## Testing Strategy

### Component Testing
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ArtifactCreator } from './ArtifactCreator';

// Mock vhybZ library
vi.mock('@vhybzOS/vhybZ', () => ({
  VhybZGenerator: vi.fn().mockImplementation(() => ({
    createArtifact: vi.fn().mockResolvedValue({
      id: 'test-artifact',
      html: '<div>Test Artifact</div>',
      title: 'Test Artifact'
    })
  }))
}));

describe('ArtifactCreator', () => {
  test('creates artifact from user prompt', async () => {
    render(<ArtifactCreator />);
    
    const input = screen.getByPlaceholderText('Describe your artifact...');
    const submitButton = screen.getByText('Generate');
    
    fireEvent.change(input, { target: { value: 'Create a todo app' } });
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Artifact created successfully')).toBeInTheDocument();
    });
  });
});
```

### Integration Testing
```typescript
describe('vhybZ Integration', () => {
  test('integrates with backend API', async () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'saved-artifact-id' })
    });
    
    const { createArtifact } = renderHook(() => useVhybZ()).result.current;
    
    const artifact = await createArtifact({
      prompt: 'Create a calculator'
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/artifacts'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json'
        })
      })
    );
  });
});
```

## Deployment & Production

### Build Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          vhybz: ['@vhybzOS/vhybZ']
        }
      }
    }
  },
  define: {
    'process.env.REACT_APP_API_URL': JSON.stringify(process.env.REACT_APP_API_URL),
    'process.env.REACT_APP_VERSION': JSON.stringify(process.env.npm_package_version)
  }
});
```

### Production Considerations
- **Bundle Size**: Target < 1MB initial bundle, < 500KB per lazy chunk
- **Performance**: Core Web Vitals compliance (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- **Security**: CSP headers, secure artifact preview, input sanitization
- **Monitoring**: Error tracking, performance metrics, user analytics
- **Accessibility**: WCAG 2.1 AA compliance, keyboard navigation, screen reader support

## Platform Integration

This web client serves as the primary interface for the vhybZ ecosystem, providing:

- **Seamless vhybZ Library Integration**: Full utilization of AI capabilities
- **Backend Synchronization**: Persistent data and authentication
- **Cross-Platform Consistency**: Shared design patterns with mobile app
- **Extensible Architecture**: Ready for future features and integrations

The architecture enables rapid development while maintaining performance, security, and user experience standards essential for the vhybZ platform's vision of democratizing AI-powered creativity.

## Cross-Repository Links

- **Backend API**: https://github.com/vhybzOS/deno-vhybZ/blob/main/AGENTS.md
- **Core Library**: https://github.com/vhybzOS/vhybZ/blob/main/AGENTS.md  
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ/blob/main/AGENTS.md
- **Product Requirements**: https://github.com/vhybzOS/deno-vhybZ/blob/main/PRD.md