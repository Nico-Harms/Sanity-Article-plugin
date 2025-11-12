# 🏗️ Hermés - System Architecture & File Structure

## 📁 Complete File Structure Overview

```
Sanity-Article-plugin/
├── 📦 packages/
│   ├── 🔗 shared/                          # Shared types & utilities
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── config.ts               # PluginConfig interface + Sanity fields
│   │   │   │   ├── generation.ts           # GenerateRequest/Response types
│   │   │   │   └── index.ts                # Export all types
│   │   │   ├── utils/
│   │   │   │   └── notionUtils.ts          # Shared Notion content extraction
│   │   │   └── index.ts                    # Export everything
│   │   └── package.json
│   │
│   └── 🔌 sanity-notion-llm-plugin/        # Sanity Studio Plugin
│       ├── src/
│       │   ├── components/                 # UI Components
│       │   │   ├── GeneralTabContent.tsx   # Dashboard overview tab
│       │   │   ├── DashboardStats.tsx      # Statistics display
│       │   │   ├── DraftList.tsx           # Draft management interface
│       │   │   ├── ApiConfigSection.tsx    # API credentials form
│       │   │   ├── SimpleFieldsTabContent.tsx # Schema mapping UI
│       │   │   ├── SettingsTabContent.tsx  # Settings tab wrapper
│       │   │   ├── GenerateTabContent.tsx  # Generation tab wrapper
│       │   │   ├── SimpleFieldCard.tsx     # Individual field mapping
│       │   │   ├── TabbedInterface.tsx     # Main navigation
│       │   │   ├── ConnectionStatus.tsx    # Connection status display
│       │   │   └── index.ts                # Export all components
│       │   │
│       │   ├── services/
│       │   │   └── apiClient.ts            # Backend API communication
│       │   │
│       │   ├── tool/
│       │   │   ├── NotionLLMTool.tsx       # Main plugin tool component
│       │   │   └── hooks/
│       │   │       ├── usePluginConfig.ts  # Plugin configuration hook
│       │   │       └── useNotionData.ts    # Notion data fetching hook
│       │   │
│       │   ├── plugin.ts                   # Plugin definition
│       │   └── index.ts                    # Plugin exports
│       └── package.json
│
├── 🖥️ apps/
│   ├── 🔧 backend/                         # Next.js API Server
│   │   ├── src/
│   │   │   ├── app/api/                    # API Routes
│   │   │   │   ├── config/route.ts         # Configuration CRUD
│   │   │   │   ├── notion/
│   │   │   │   │   ├── table/route.ts      # Notion database queries
│   │   │   │   │   ├── status/route.ts     # Notion status updates
│   │   │   │   │   └── test/route.ts       # Notion connection test
│   │   │   │   ├── generate/route.ts       # LLM content generation
│   │   │   │   ├── drafts/
│   │   │   │   │   ├── route.ts            # Fetch drafts with metadata
│   │   │   │   │   ├── stats/route.ts      # Dashboard statistics
│   │   │   │   │   ├── approve/route.ts    # Approve drafts
│   │   │   │   │   └── reject/route.ts     # Reject drafts
│   │   │   │   └── cron/
│   │   │   │       └── generate-content/route.ts  # Automated scheduling
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── services/               # Business Logic Layer
│   │   │   │   │   ├── ConfigService.ts    # Configuration management
│   │   │   │   │   ├── NotionService.ts    # Notion API integration
│   │   │   │   │   ├── LLMService.ts       # Mistral API integration
│   │   │   │   │   ├── SanityService.ts    # Sanity CMS integration
│   │   │   │   │   ├── EncryptionService.ts # API key encryption
│   │   │   │   │   └── index.ts            # Export all services
│   │   │   │   │
│   │   │   │   ├── database/
│   │   │   │   │   ├── connection.ts       # MongoDB connection
│   │   │   │   │   ├── models.ts           # Database schemas
│   │   │   │   │   └── draftMetadata.ts    # Draft status tracking service
│   │   │   │   │
│   │   │   │   └── cors.ts                 # CORS configuration
│   │   │   │
│   │   │   └── middleware.ts               # Request middleware
│   │   │
│   │   ├── package.json
│   │   └── .env.local                      # Environment variables
│   │
│   └── 🎨 studio/                          # Sanity Studio
│       └── plugin-project/
│           ├── sanity.config.ts            # Studio configuration
│           ├── sanity.cli.ts               # CLI configuration
│           ├── schemaTypes/
│           │   └── post.ts                 # Example content schema
│           └── package.json
│
├── 📖 README.md                            # Project documentation
└── 📄 package.json                         # Root workspace config
```

## 🔄 Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   📝 Notion     │    │   🤖 LLM        │    │   📰 Sanity     │
│   Database      │───▶│   Multi-Provider│───▶│   CMS           │
│                 │◀───│                 │    │                 │
│ • Content Plan  │    │ • OpenAI GPT-4  │    │ • Draft Review  │
│ • Scheduled     │    │ • Mistral       │    │ • Approval      │
│   Dates         │    │ • Gemini        │    │ • Publishing    │
│ • Status Sync   │    │ • Perplexity    │    │ • Open in Studio│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🔧 Backend API Server                        │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────┐  ┌─────────────┐        │
│  │ Notion      │  │ LLM Service      │  │ Sanity      │        │
│  │ Service     │  │ • Factory Pattern│  │ Service     │        │
│  │ • Fetch     │  │ • OpenAI         │  │ • Create    │        │
│  │ • Status    │  │ • Mistral        │  │ • Approve   │        │
│  │   Update    │  │ • Gemini         │  │ • Publish   │        │
│  └─────────────┘  │ • Perplexity     │  └─────────────┘        │
│                   └──────────────────┘                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              📊 MongoDB Database                            │ │
│  │                                                             │ │
│  │ • Encrypted API Keys (Notion, LLM, Sanity)                 │ │
│  │ • Plugin Configurations (per Studio, multi-tenant)         │ │
│  │ • Draft Metadata (lifecycle tracking)                      │ │
│  │ • LLM Provider & Model Selection                           │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🎨 Sanity Studio Plugin                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ General     │  │ Fields      │  │ Settings    │             │
│  │ Overview    │  │ Mapping     │  │ & Config    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────┐  ┌─────────────────────────────────────────┐   │
│  │ Generate    │  │              📊 General Tab              │   │
│  │ Content     │  │                                           │   │
│  └─────────────┘  │ • Dashboard Statistics                   │   │
│                   │ • Draft Management List                  │   │
│                   │ • Status Tracking & Actions              │   │
│                   │ • Filter by Status                       │   │
│                   │ • Structure-Based Content Preview        │   │
│                   │ • Open in Sanity Studio                  │   │
│                   └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 File Roles & Responsibilities

### 🔗 **Shared Package** (`packages/shared/`)

- **Purpose**: Common types and utilities used by both plugin and backend
- **Key Files**:
  - `config.ts`: PluginConfig interface with Sanity credentials
  - `generation.ts`: API request/response types for content generation
  - `notionUtils.ts`: Shared Notion content extraction logic

### 🔌 **Plugin Package** (`packages/sanity-notion-llm-plugin/`)

- **Purpose**: Sanity Studio plugin UI and client-side logic
- **Key Components**:
  - `NotionLLMTool.tsx`: Main plugin entry point with tabbed interface
  - `GeneralTabContent.tsx`: Dashboard overview with statistics and draft list
  - `DashboardStats.tsx`: Real-time statistics display with status breakdown
  - `DraftList.tsx`: Comprehensive draft management with status filtering
  - `DraftModal.tsx`: Full-featured draft preview with content display
  - `MinimalContentFormatter.tsx`: Structure-based content renderer (universal schema support)
  - `ApiConfigSection.tsx`: Multi-provider LLM configuration with model selection
  - `SimpleFieldsTabContent.tsx`: Schema field mapping configuration
  - `apiClient.ts`: HTTP client for backend communication

### 🔧 **Backend Package** (`apps/backend/`)

- **Purpose**: API server handling all external integrations
- **Key Services**:
  - `ConfigService.ts`: MongoDB configuration management with multi-tenant support
  - `NotionService.ts`: Notion API integration, content extraction, and status synchronization
  - `LLMService.ts`: Multi-provider orchestration with factory pattern
    - `providers/OpenAIProvider.ts`: OpenAI GPT-4 and GPT-3.5-turbo
    - `providers/MistralProvider.ts`: Mistral Large and Small models
    - `providers/GeminiProvider.ts`: Google Gemini Pro and Flash
    - `providers/PerplexityProvider.ts`: Perplexity Sonar models
  - `SanityService.ts`: Document creation, approval, and publishing workflow
  - `SchemaService.ts`: Dynamic schema detection and content conversion
  - `EncryptionService.ts`: AES-256-GCM API key encryption
  - `DraftMetadataService.ts`: Draft lifecycle tracking and status management

### 🎨 **Studio Package** (`apps/studio/`)

- **Purpose**: Sanity Studio consuming the plugin
- **Key Files**:
  - `sanity.config.ts`: Studio configuration with plugin
  - `post.ts`: Example content schema for testing

## 🔄 **Content Generation Flow**

1. **📝 Notion Planning**: Content managers create articles with "Waiting to generate" status
2. **⚙️ Configuration**: Studio admins configure API keys, select LLM provider, and set up field mappings
3. **🗓️ Monday Generation**: Automated cron generates drafts for the week → Notion status: "In progress"
4. **📰 Draft Creation**: Content saved as drafts in Sanity CMS with MongoDB metadata tracking
5. **👀 Review**: Editors review drafts in General tab with structure-based content preview
6. **✅ Approval**: Approved drafts ready for publishing → Notion status: "Approved"
7. **📅 Publishing**: Daily cron publishes approved content on scheduled dates → Notion status: "Published"
8. **🔄 Status Sync**: Full lifecycle tracked in MongoDB with bidirectional Notion status updates

## 🛡️ **Security Features**

- **🔐 Encrypted Storage**: All API keys encrypted with AES-256-GCM
- **🏢 Multi-Tenant**: Each Studio has isolated configuration
- **🔒 Server-Side Decryption**: Keys only decrypted in backend
- **🛡️ CORS Protection**: Proper CORS headers for cross-origin requests

## 📊 **Database Schema**

- **`configs` Collection**: Plugin configurations per Studio
  - Multi-tenant isolation with `studioId`
  - LLM provider selection (openai|mistral|gemini|perplexity)
  - Encrypted API keys for all services
  - Dynamic field mappings per schema
  - System instructions for LLM prompts

- **`draft_metadata` Collection**: Draft lifecycle tracking
  - Status progression (pending_review → approved → published)
  - Planned publish dates from Notion
  - Sanity draft and published document IDs
  - Timestamps for all lifecycle events
  - Notion sync status tracking

- **Encrypted Fields**: `notionClientSecret`, `llmApiKey`, `sanityToken`, `sanityProjectId`

This architecture provides a complete content automation pipeline from Notion planning to Sanity publishing with full editorial control, multi-LLM support, bidirectional Notion sync, and multi-tenant isolation! 🚀
