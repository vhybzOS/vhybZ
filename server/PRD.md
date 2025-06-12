# Product Requirements Document (PRD) - vhybZ Backend

## Overview

vhybZ is an AI-powered platform that enables creators to build interactive digital artifacts through natural language conversations, eliminating the need for coding skills. This PRD outlines the backend features required to support the complete vhybZ ecosystem.

## Platform Architecture

### Separation of Concerns

**Backend (This Repository)**:
- **Role**: Data store and API layer
- **Responsibilities**: User management, artifact storage, authentication, analytics, public hosting
- **Does NOT handle**: AI/LLM interactions, HTML generation, real-time preview logic

**vhybZ Core Library**:
- **Repository**: https://github.com/vhybzOS/vhybZ
- **Responsibilities**: LLM API calls, HTML generation, real-time preview, SOUL framework, Confidant

**Frontend Clients**:
- **Web Client**: React app hosted at `vhybz.com` (repo: https://github.com/vhybzOS/web-vhybZ)
- **Mobile Client**: React Native app (repo: https://github.com/vhybzOS/RN-vhybZ)
- **Responsibilities**: UI layer, imports vhybZ library for core functionality

**Artifact Hosting**: Custom subdomains at `username.vhybz.com/artifact-name` (served by backend)

### Core User Flow
1. User authenticates via Google OAuth (backend)
2. Frontend imports vhybZ library and presents ChatGPT-like interface 
3. User describes desired artifact in natural language
4. **vhybZ library** calls LLM APIs and generates HTML artifact with real-time preview
5. **vhybZ library** sends generated artifact to **backend** for storage
6. User iterates with prompts to refine artifact (vhybZ library handles LLM calls)
7. Final artifact published via backend to custom URL for sharing

## Current State Analysis

### Implemented Features ✅
- Google OAuth authentication
- Basic user and app collections in MongoDB
- Session management with HTTP-only cookies
- Fresh 2.0 framework with Deno runtime
- Basic middleware architecture

### Missing Critical Features ❌

## Required Backend Features

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
- Store artifact HTML/CSS/JS content received from frontend
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

### 4. Asset Management System

**Priority**: P1

#### File Upload & Storage
```
POST /api/assets/upload
GET /api/assets/:id
DELETE /api/assets/:id
```

**Requirements**:
- Support for images, videos, audio files
- File type validation and security scanning
- Image optimization and multiple formats
- CDN integration (AWS CloudFront, Cloudflare)
- Asset usage tracking and cleanup

### 5. Real-time Collaboration

**Priority**: P1

#### WebSocket Infrastructure
```
WebSocket /ws/artifacts/:id
POST /api/artifacts/:id/collaborators
GET /api/artifacts/:id/presence
```

**Requirements**:
- Real-time multi-user editing
- Operational Transform for conflict resolution
- Live cursor tracking and user presence
- Permission-based access control

#### Collaboration Management
```
POST /api/artifacts/:id/invite
PUT /api/artifacts/:id/permissions
GET /api/artifacts/:id/activity
```

**Requirements**:
- Role-based permissions (view, comment, edit, admin)
- Activity feed for changes
- Comment and review system
- Notification system for collaboration events

### 6. Analytics & Insights

**Priority**: P1

#### Usage Analytics
```
POST /api/analytics/events
GET /api/analytics/artifacts/:id
GET /api/analytics/users/:id/dashboard
```

**Requirements**:
- View counts and engagement metrics
- Geographic and demographic insights
- Referrer tracking and attribution
- Creator dashboard with insights
- A/B testing framework

### 7. GenAI Vendor Platform

**Priority**: P2

#### Vendor Onboarding
```
POST /api/vendors/register
GET /api/vendors/tools
POST /api/vendors/tools
```

**Requirements**:
- Vendor verification and KYC process
- API key management and sandboxing
- Tool submission and approval workflow
- Revenue sharing and billing integration

#### Marketplace API
```
GET /api/marketplace/tools
POST /api/marketplace/tools/:id/install
GET /api/marketplace/categories
```

**Requirements**:
- Tool discovery and search
- User reviews and ratings system
- Featured tools and promotions
- Usage analytics for vendors

### 8. Content Moderation

**Priority**: P1

#### Automated Moderation
```
POST /api/moderation/scan
GET /api/moderation/reports
PUT /api/moderation/decisions/:id
```

**Requirements**:
- AI-powered content scanning
- Community reporting system
- Admin review dashboard
- Automated takedown procedures

### 9. Performance & Infrastructure

**Priority**: P1

#### Caching & Optimization
- Redis for session and artifact caching
- Database query optimization
- Background job processing for AI generation
- Rate limiting by user tier

#### Monitoring & Observability
- Error tracking and alerting
- Performance monitoring
- Resource usage tracking
- Automated scaling policies

### 10. Security & Compliance

**Priority**: P1

#### Enhanced Authentication
```
POST /api/auth/mfa/setup
POST /api/auth/api-keys
GET /api/auth/sessions
```

**Requirements**:
- Multi-factor authentication
- API key management for developers
- Session management and security
- OAuth provider extensibility

#### Data Privacy
```
GET /api/users/:id/data-export
DELETE /api/users/:id/data-deletion
GET /api/compliance/audit-logs
```

**Requirements**:
- GDPR compliance tools
- Data export and deletion
- Audit logging
- Privacy settings management

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

## Implementation Roadmap

### Phase 1: Core Data Storage & API (4-6 weeks)
- Conversation and artifact storage APIs
- Enhanced artifact management with versioning
- Public artifact hosting with subdomain routing
- Basic analytics implementation

### Phase 2: Collaboration & Community (6-8 weeks)  
- Real-time collaboration features
- Asset management system
- Social sharing and engagement features
- Content moderation system

### Phase 3: Platform & Ecosystem (8-10 weeks)
- GenAI vendor marketplace
- Advanced analytics and insights
- Developer API and webhook system
- Enterprise features and compliance

## Technical Considerations

### Performance Requirements
- **Data Storage/Retrieval**: < 200ms for artifact CRUD operations
- **Real-time Collaboration**: < 100ms latency for live updates
- **Public Hosting**: < 2 seconds page load time globally
- **API Response Times**: < 500ms for 95th percentile

### Scalability Targets
- Support 100K+ concurrent users
- Handle 1M+ artifacts hosted
- Store/serve 10K+ artifact requests per hour
- Store 100TB+ of user assets

### Security Standards
- SOC 2 Type II compliance
- GDPR and CCPA compliance
- OAuth 2.0 and OpenID Connect
- End-to-end encryption for sensitive data

## Success Metrics

### User Engagement
- Daily active creators
- Artifacts created per user
- Session duration and return visits
- Collaboration usage rates

### Platform Growth
- New user registration rate
- Artifact view and share rates
- Revenue per user (freemium conversion)
- Vendor adoption and tool usage

### Technical Performance
- System uptime (99.9% target)
- API response times
- Error rates and resolution times
- Infrastructure cost efficiency