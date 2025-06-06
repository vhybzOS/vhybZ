# vhybZ Core Library - Architecture & Implementation Guide

## Overview

The vhybZ Core Library is the heart of the vhybZ platform, providing AI-powered artifact generation capabilities that are shared across all client applications. This library handles the complex orchestration of LLM interactions, artifact generation, and the SOUL framework for agentic experiences.

## Architecture Position

### Repository Ecosystem
- **Backend API**: https://github.com/vhybzOS/deno-vhybZ (Deno/Fresh data store and authentication)
- **Core Library**: https://github.com/vhybzOS/vhybZ (this repo - AI logic and generation)
- **Web Client**: https://github.com/vhybzOS/web-vhybZ (React frontend)
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ (React Native app)

### Separation of Concerns
- **This Library**: LLM integration, artifact generation, SOUL framework, real-time preview
- **Backend**: Data persistence, authentication, public hosting, analytics
- **Frontend Clients**: UI layer, user interaction, platform-specific features

## Core Components

### 1. LLM Integration Engine

#### Multi-Provider Architecture
```
src/providers/
├── openai/          # OpenAI GPT models
├── anthropic/       # Claude models  
├── huggingface/     # Open source models
├── custom/          # Custom model endpoints
└── router.ts        # Intelligent routing logic
```

**Key Features**:
- **Model Router**: Automatically selects optimal model based on task type, cost, and performance
- **Streaming Support**: Real-time response streaming for all providers
- **Fallback Logic**: Automatic failover between providers for reliability
- **Cost Optimization**: Balances quality vs. cost based on user subscription tier

#### Provider Interface
```typescript
interface LLMProvider {
  generateArtifact(prompt: string, context: ConversationContext): AsyncIterable<ArtifactUpdate>;
  estimateCost(prompt: string, model: string): number;
  validateResponse(response: string): boolean;
}
```

### 2. Artifact Generation System

#### Generation Pipeline
```
src/generation/
├── prompts/         # Prompt templates and engineering
├── validators/      # HTML/CSS/JS validation and sanitization
├── templates/       # Artifact templates and scaffolding
└── engine.ts        # Core generation orchestration
```

**Process Flow**:
1. **Prompt Engineering**: Convert user intent to optimized LLM prompts
2. **Template Selection**: Choose appropriate scaffolding based on artifact type
3. **LLM Generation**: Stream HTML/CSS/JS generation with real-time updates
4. **Validation**: Sanitize and validate generated code for security
5. **Preview Generation**: Create live preview for user feedback
6. **Iteration Support**: Handle refinement requests and incremental updates

#### Artifact Types
- **Interactive Apps**: Todo lists, calculators, games
- **Data Visualizations**: Charts, dashboards, infographics  
- **Educational Content**: Tutorials, quizzes, learning modules
- **Creative Tools**: Drawing apps, music makers, story generators
- **Productivity**: Planners, trackers, organizers

### 3. SOUL Framework Integration

#### Meta-Agent Architecture
```
src/soul/
├── agents/          # Individual agent implementations
├── memory/          # Persistent memory and state management
├── protocols/       # Agent communication protocols
└── orchestrator.ts  # Agent coordination and lifecycle
```

**SOUL Capabilities**:
- **Soulmades**: Persistent meta-agents that evolve with user interactions
- **Memory System**: Maintains context across sessions and iterations
- **Proactive Agency**: Agents can act without explicit prompts
- **Creative Lineage**: Tracks artifact evolution and remix history
- **Multi-Agent Coordination**: Society of minds working together

#### Agent Lifecycle
1. **Initialization**: Agent created with specific role and constraints
2. **Memory Loading**: Restore previous context and learned behaviors
3. **Task Execution**: Perform artifact generation and refinement
4. **Learning**: Update memory based on user feedback and outcomes
5. **Persistence**: Save agent state for future sessions

### 4. Confidant Integration

#### System Bridge Architecture
```
src/confidant/
├── desktop/         # Desktop application control
├── mobile/          # Mobile device interactions
├── iot/            # IoT and peripheral control
└── coordinator.ts   # Cross-platform orchestration
```

**Confidant Capabilities**:
- **Digital Dexterity**: Control desktop apps, browsers, and system functions
- **Physical Embodiment**: Interface with robots, IoT devices, and sensors
- **Cross-App Synergy**: Coordinate actions across multiple applications
- **Real-World Integration**: Bridge digital artifacts with physical actions

### 5. Real-Time Preview System

#### Preview Engine
```
src/preview/
├── renderer/        # Safe HTML/CSS/JS execution environment
├── sandbox/         # Security isolation for generated code
├── streaming/       # Real-time update coordination
└── optimizer.ts     # Performance optimization
```

**Features**:
- **Sandboxed Execution**: Safe preview environment for generated code
- **Incremental Updates**: Stream partial updates during generation
- **Performance Optimization**: Efficient rendering of complex artifacts
- **Error Handling**: Graceful degradation for invalid code

## Integration Patterns

### Frontend Client Integration

#### Installation
```bash
npm install @vhybzOS/vhybZ
```

#### Basic Usage
```typescript
import { VhybZGenerator, SOULAgent } from '@vhybzOS/vhybZ';

// Initialize generator
const generator = new VhybZGenerator({
  apiEndpoint: 'https://api.vhybz.com',
  authToken: userToken,
  preferences: userPreferences
});

// Create artifact with real-time preview
const stream = generator.createArtifact({
  prompt: "Create an interactive weather dashboard",
  type: 'visualization',
  onUpdate: (update) => {
    // Handle real-time preview updates
    updatePreview(update.html, update.css, update.js);
  }
});

// Handle completion
const artifact = await stream.complete();
await generator.saveToBackend(artifact);
```

#### SOUL Agent Usage
```typescript
// Create persistent agent
const agent = new SOULAgent({
  name: 'ArtifactCreator',
  memory: userMemory,
  constraints: {
    maxActions: 10,
    allowedDomains: ['artifact-creation']
  }
});

// Agent-driven artifact creation
const artifact = await agent.createArtifact({
  userIntent: "I need a productivity tool",
  context: conversationHistory,
  preferences: userPreferences
});
```

### Backend Communication

#### API Integration
```typescript
// Save generated artifact
await backend.artifacts.create({
  content: artifact.html,
  metadata: {
    title: artifact.title,
    description: artifact.description,
    tags: artifact.tags,
    generatedBy: agent.id
  },
  conversation: conversationId
});

// Retrieve conversation history
const history = await backend.conversations.get(conversationId);
const context = buildContext(history);
```

## Development Workflow

### Adding New Features

#### New LLM Provider
1. Implement `LLMProvider` interface
2. Add provider configuration to router
3. Test with artifact generation scenarios
4. Update cost optimization algorithms
5. Add fallback and error handling

#### New Artifact Type
1. Create template in `src/templates/`
2. Define prompt patterns in `src/prompts/`
3. Implement type-specific validation
4. Add preview rendering logic
5. Test across different LLM providers

#### SOUL Agent Enhancement
1. Define agent behavior in `src/soul/agents/`
2. Implement memory patterns
3. Add communication protocols
4. Test multi-agent coordination
5. Validate performance and resource usage

### Testing Strategy

#### Unit Tests
- LLM provider interfaces and responses
- Artifact validation and sanitization
- SOUL agent memory and state management
- Preview rendering and sandbox security

#### Integration Tests
- End-to-end artifact generation flows
- Backend API communication
- Multi-provider fallback scenarios
- Real-time preview streaming

#### Performance Tests
- LLM response time optimization
- Memory usage in long-running sessions
- Concurrent artifact generation
- Preview rendering performance

## Quality Standards

### Security
- **Sandboxed Execution**: All generated code runs in isolated environment
- **Content Sanitization**: HTML/CSS/JS validation and XSS prevention
- **API Key Protection**: Secure LLM provider credential management
- **User Data Privacy**: Minimal data retention and secure transmission

### Performance
- **Streaming First**: All interactions support real-time updates
- **Efficient Memory**: Optimized agent memory and state management
- **Concurrent Operations**: Support multiple simultaneous generations
- **Resource Limits**: Configurable constraints for cost and performance

### Reliability
- **Provider Redundancy**: Automatic failover between LLM providers
- **Graceful Degradation**: Fallback to simpler models when needed
- **Error Recovery**: Robust error handling and user feedback
- **State Persistence**: Reliable saving and restoration of agent state

## Platform Vision

The vhybZ Core Library enables the platform's vision of democratizing creative AI by:

- **Abstracting Complexity**: Simple interfaces hide complex AI orchestration
- **Enabling Agency**: SOUL framework provides persistent, proactive AI assistance
- **Ensuring Quality**: Consistent artifact generation across all platforms
- **Supporting Growth**: Scalable architecture for millions of users
- **Facilitating Remix**: Creative lineage and collaborative artifact evolution

This library is the foundation that makes "vibe coding for the masses" possible, transforming natural language intent into living, interactive digital experiences.

## Cross-Repository Links

- **Backend Implementation**: https://github.com/vhybzOS/deno-vhybZ/blob/main/AGENTS.md
- **Web Client Integration**: https://github.com/vhybzOS/web-vhybZ/blob/main/AGENTS.md  
- **Mobile Client Integration**: https://github.com/vhybzOS/RN-vhybZ/blob/main/AGENTS.md
- **Product Requirements**: https://github.com/vhybzOS/deno-vhybZ/blob/main/PRD.md