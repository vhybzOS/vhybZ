# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **vhybZ Core Library** - a shared package that provides AI-powered artifact generation capabilities for all vhybZ client applications.

### Repository Role
- **Core AI/LLM Integration**: Handles communication with OpenAI, Anthropic, and other LLM providers
- **Artifact Generation Engine**: Converts natural language prompts into interactive HTML/CSS/JS artifacts
- **Real-time Preview Logic**: Provides live preview capabilities during artifact creation
- **SOUL Framework**: Meta-agents for persistent memory and agency
- **Confidant**: Bridge for physical/digital world interactions

### Architecture Position
This library is imported by frontend clients and communicates with the backend API:

- **Backend API**: https://github.com/vhybzOS/deno-vhybZ (data storage, auth, public hosting)
- **Core Library**: https://github.com/vhybzOS/vhybZ (this repo - AI logic)
- **Web Client**: https://github.com/vhybzOS/web-vhybZ (React UI)
- **Mobile Client**: https://github.com/vhybzOS/RN-vhybZ (React Native UI)

### Key Components

#### LLM Integration
- Multi-provider support (OpenAI, Anthropic, etc.)
- Intelligent model routing and optimization
- Cost-effective model selection based on task requirements
- Streaming responses for real-time feedback

#### Artifact Generation
- Natural language to HTML/CSS/JS conversion
- Template-based scaffolding system
- Iterative refinement through conversation
- Code validation and sanitization

#### SOUL Framework
- Meta-agents for persistent memory and creative lineage
- Proactive agency and unprompted actions
- Multimodal tracking and interaction metadata
- Society of minds with interacting agents

#### Confidant
- Cross-platform service for extending agent capabilities
- Digital dexterity for desktop/web application control
- Physical embodiment through peripheral control
- Cross-app coordination and automation

### Integration Patterns

#### Frontend Client Usage
```javascript
import { vhybZ } from '@vhybzOS/vhybZ';

// Initialize with backend API endpoint
const generator = new vhybZ({
  apiEndpoint: 'https://api.vhybz.com',
  authToken: userToken
});

// Generate artifact from prompt
const artifact = await generator.createArtifact({
  prompt: "Create a todo app",
  onProgress: (update) => showPreview(update)
});

// Save to backend
await generator.saveArtifact(artifact);
```

#### Backend Communication
- Sends generated artifacts to backend for persistence
- Retrieves user conversation history and preferences
- Handles authentication tokens from backend OAuth flow
- Manages artifact versioning and metadata

### Development Guidelines

#### Adding New LLM Providers
1. Implement provider interface in `src/providers/`
2. Add provider configuration to routing logic
3. Test with various artifact generation scenarios
4. Update cost optimization algorithms

#### Extending SOUL Capabilities
1. Define new agent behaviors in `src/soul/agents/`
2. Implement memory patterns in `src/soul/memory/`
3. Add interaction protocols in `src/soul/protocols/`
4. Test agent coordination and conflict resolution

#### Artifact Templates
1. Create templates in `src/templates/`
2. Define template metadata and categories
3. Implement template customization logic
4. Add template discovery and search

### Quality Standards
- All LLM interactions must be streaming-capable
- Artifact generation must be deterministic given same inputs
- Error handling for LLM API failures and rate limits
- Comprehensive testing for artifact safety and validation

### Platform Integration
This library enables the core vhybZ vision of "vibe coding for the masses" by:
- Abstracting complex AI interactions into simple interfaces
- Providing consistent artifact generation across all client platforms
- Enabling seamless backend integration for persistence and sharing
- Supporting the SOUL framework for agentic experiences

See documentation in other repositories:
- Backend API: https://github.com/vhybzOS/deno-vhybZ/blob/main/CLAUDE.md
- Web Client: https://github.com/vhybzOS/web-vhybZ/blob/main/CLAUDE.md
- Mobile Client: https://github.com/vhybzOS/RN-vhybZ/blob/main/CLAUDE.md