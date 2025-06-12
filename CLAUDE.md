# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **vhybZ Web Client** - a React application that provides the web interface for the vhybZ platform, enabling users to create interactive digital artifacts through natural language conversations.

### Repository Role
- **Web UI Layer**: React-based user interface for vhybZ platform
- **vhybZ Library Integration**: Imports and uses @vhybzOS/vhybZ for core functionality
- **User Experience**: ChatGPT-like interface with real-time artifact preview
- **Platform Integration**: Communicates with backend API for authentication and data persistence

## Development Commands

### Core Development
- `npm run dev` - Start Vite development server with hot reload
- `npm run build` - Build production bundle (TypeScript + Vite)
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Quality Assurance
Before committing changes, always run:
- `npm run lint` - Validates code style and catches issues
- `npm run build` - Ensures production build succeeds

## Architecture Overview

### Technology Stack
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 6.3.5 with hot module replacement
- **UI Library**: Material-UI 7.1.1 with Emotion styling
- **Development**: ESLint with React-specific rules

### Repository Context
- **Backend API**: https://github.com/vhybzOS/deno-vhybZ (Deno/Fresh data store)
- **Core Library**: https://github.com/vhybzOS/vhybZ (AI logic and generation)
- **Web Client**: https://github.com/vhybzOS/web-vhybZ (this repo - React UI)
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ (React Native app)

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

## Key Integration Patterns

### vhybZ Library Usage
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

### Backend API Integration
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

### Real-time Preview System
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

## Core Features Implementation

### 1. ChatGPT-like Interface
- **Conversation UI**: Chat interface for natural language interaction
- **Message History**: Persistent conversation tracking
- **Real-time Typing**: Streaming responses during artifact generation
- **Multi-modal Input**: Support for text, voice, and image inputs

### 2. Artifact Creation Workflow
- **Prompt Input**: Rich text input with suggestions and templates
- **Live Preview**: Real-time artifact preview during generation
- **Iteration Support**: Refinement through follow-up prompts
- **Version History**: Track artifact evolution and changes

### 3. User Dashboard
- **Artifact Gallery**: Grid view of user's created artifacts
- **Search and Filter**: Find artifacts by type, date, or keywords
- **Sharing Controls**: Manage artifact privacy and sharing settings
- **Analytics**: View artifact performance and engagement

### 4. Collaboration Features
- **Real-time Editing**: Multi-user artifact collaboration
- **Comments System**: Feedback and discussion on artifacts
- **Version Control**: Branch and merge artifact variations
- **Sharing**: Public links and embed codes for artifacts

## State Management Patterns

### React Hooks for vhybZ Integration
```typescript
// Custom hook for artifact generation
function useArtifactGenerator() {
  const [generator] = useState(() => new VhybZGenerator({
    apiEndpoint: process.env.REACT_APP_API_URL,
    authToken: getAuthToken()
  }));
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  
  const createArtifact = useCallback(async (prompt: string) => {
    setIsGenerating(true);
    
    try {
      const stream = generator.createArtifact({
        prompt,
        onUpdate: setPreviewContent,
        onComplete: () => setIsGenerating(false)
      });
      
      return await stream.complete();
    } catch (error) {
      setIsGenerating(false);
      throw error;
    }
  }, [generator]);
  
  return { createArtifact, isGenerating, previewContent };
}
```

### Context for Global State
```typescript
// Authentication context
const AuthContext = createContext<{
  user: User | null;
  token: string | null;
  login: () => void;
  logout: () => void;
}>({});

// Artifact context
const ArtifactContext = createContext<{
  artifacts: Artifact[];
  currentArtifact: Artifact | null;
  createArtifact: (prompt: string) => Promise<Artifact>;
  updateArtifact: (id: string, changes: Partial<Artifact>) => Promise<void>;
}>({});
```

## Environment Configuration

### Required Environment Variables
```env
REACT_APP_API_URL=https://api.vhybz.com
REACT_APP_ENVIRONMENT=development
REACT_APP_VERSION=1.0.0
```

### Build Configuration
- **Vite Config**: Optimized for React with TypeScript
- **ESLint**: React-specific linting rules and best practices
- **TypeScript**: Strict mode with comprehensive type checking
- **Material-UI**: Theme customization and component optimization

## Performance Considerations

### Code Splitting
```typescript
// Lazy load heavy components
const ArtifactEditor = lazy(() => import('./components/ArtifactEditor'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Route-based splitting
const Router = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/create" element={<ArtifactEditor />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  </Suspense>
);
```

### Optimization Strategies
- **Bundle Splitting**: Separate vendor and application bundles
- **Tree Shaking**: Remove unused vhybZ library features
- **Image Optimization**: Compressed assets and lazy loading
- **Service Worker**: Cache static assets and API responses

## Testing Strategy

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { ArtifactCreator } from './ArtifactCreator';

test('creates artifact from prompt', async () => {
  render(<ArtifactCreator />);
  
  const input = screen.getByPlaceholderText('Describe your artifact...');
  fireEvent.change(input, { target: { value: 'Create a todo app' } });
  
  const button = screen.getByText('Generate');
  fireEvent.click(button);
  
  expect(await screen.findByText('Generating...')).toBeInTheDocument();
});
```

### Integration Testing
- **vhybZ Library**: Test artifact generation and preview
- **Backend API**: Test authentication and data persistence
- **Real-time Features**: Test streaming and collaboration
- **Error Handling**: Test network failures and recovery

## Deployment

### Build Process
1. **Type Checking**: Ensure TypeScript compilation succeeds
2. **Linting**: Validate code quality and style
3. **Testing**: Run unit and integration tests
4. **Building**: Create optimized production bundle
5. **Asset Optimization**: Compress images and resources

### Hosting
- **Static Hosting**: Deploy to CDN (Vercel, Netlify, AWS S3)
- **Environment Variables**: Configure API endpoints for production
- **Custom Domain**: Host at `vhybz.com` with SSL certificate
- **Performance Monitoring**: Track bundle size and load times

## Cross-Repository Integration

This web client integrates with the broader vhybZ ecosystem:

- **Core Library**: Uses @vhybzOS/vhybZ for AI functionality
- **Backend API**: Authenticates and persists data via backend
- **Mobile App**: Shares design patterns and user experience
- **Platform Vision**: Enables "vibe coding for the masses" on the web

## Development Guidelines

### Code Style
- **TypeScript**: Use strict typing and avoid `any`
- **React Patterns**: Functional components with hooks
- **Material-UI**: Follow design system and theming
- **Performance**: Optimize for Core Web Vitals

### Integration Best Practices
- **Error Boundaries**: Graceful handling of vhybZ library errors
- **Loading States**: Smooth UX during artifact generation
- **Accessibility**: WCAG compliance for all interactive elements
- **Security**: Sanitize user content and validate inputs

See documentation in related repositories:
- **Backend API**: https://github.com/vhybzOS/deno-vhybZ/blob/main/CLAUDE.md
- **Core Library**: https://github.com/vhybzOS/vhybZ/blob/main/CLAUDE.md
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ/blob/main/CLAUDE.md