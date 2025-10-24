# 🏗️ System Architecture & File Structure

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
│       │   │   ├── ApiConfigSection.tsx    # API credentials form
│       │   │   ├── DraftReviewSection.tsx  # Draft approval interface
│       │   │   ├── FieldsTabContent.tsx    # Schema mapping UI
│       │   │   ├── SettingsTabContent.tsx  # Settings tab wrapper
│       │   │   ├── GenerateTabContent.tsx  # Generation tab wrapper
│       │   │   ├── FieldMappingCard.tsx    # Individual field mapping
│       │   │   ├── TabbedInterface.tsx     # Main navigation
│       │   │   ├── ConnectionStatus.tsx    # Connection status display
│       │   │   └── index.ts                # Export all components
│       │   │
│       │   ├── services/
│       │   │   └── apiClient.ts            # Backend API communication
│       │   │
│       │   ├── tool/
│       │   │   └── NotionLLMTool.tsx       # Main plugin tool component
│       │   │
│       │   ├── utils/
│       │   │   └── schemaUtils.ts          # Sanity schema utilities
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
│   │   │   │   │   ├── route.ts            # Fetch drafts
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
│   │   │   │   │   └── models.ts           # Database schemas
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
│   Database      │───▶│   (Mistral)     │───▶│   CMS           │
│                 │    │                 │    │                 │
│ • Content Plan  │    │ • Generate      │    │ • Draft Review  │
│ • Scheduled     │    │   Articles      │    │ • Approval      │
│   Dates         │    │ • JSON Output   │    │ • Publishing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🔧 Backend API Server                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Notion      │  │ LLM         │  │ Sanity      │             │
│  │ Service     │  │ Service     │  │ Service     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              📊 MongoDB Database                            │ │
│  │                                                             │ │
│  │ • Encrypted API Keys (Notion, LLM, Sanity)                 │ │
│  │ • Plugin Configurations (per Studio)                       │ │
│  │ • Generation History                                       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    🎨 Sanity Studio Plugin                      │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Fields      │  │ Settings    │  │ Generate    │             │
│  │ Mapping     │  │ & Config    │  │ Content     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              📋 Draft Review Tab                            │ │
│  │                                                             │ │
│  │ • View Generated Drafts                                    │ │
│  │ • Approve/Reject Actions                                   │ │
│  │ • Direct Links to Sanity CMS                               │ │
│  └─────────────────────────────────────────────────────────────┘ │
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
  - `ApiConfigSection.tsx`: API credentials configuration form
  - `DraftReviewSection.tsx`: Draft approval workflow interface
  - `FieldsTabContent.tsx`: Schema field mapping configuration
  - `apiClient.ts`: HTTP client for backend communication

### 🔧 **Backend Package** (`apps/backend/`)

- **Purpose**: API server handling all external integrations
- **Key Services**:
  - `ConfigService.ts`: MongoDB configuration management
  - `NotionService.ts`: Notion API integration and content extraction
  - `LLMService.ts`: Mistral API integration for content generation
  - `SanityService.ts`: Sanity CMS document creation and management
  - `EncryptionService.ts`: AES-256-GCM API key encryption

### 🎨 **Studio Package** (`apps/studio/`)

- **Purpose**: Sanity Studio consuming the plugin
- **Key Files**:
  - `sanity.config.ts`: Studio configuration with plugin
  - `post.ts`: Example content schema for testing

## 🔄 **Content Generation Flow**

1. **📝 Notion Planning**: Content creators plan articles in Notion database
2. **⚙️ Configuration**: Studio admins configure API keys and field mappings
3. **🤖 Generation**: LLM generates content from Notion data
4. **📰 Draft Creation**: Content saved as drafts in Sanity CMS
5. **👀 Review**: Editors review drafts in Studio plugin
6. **✅ Approval**: Approved drafts scheduled for publishing
7. **📅 Publishing**: Cron job publishes approved content on scheduled dates

## 🛡️ **Security Features**

- **🔐 Encrypted Storage**: All API keys encrypted with AES-256-GCM
- **🏢 Multi-Tenant**: Each Studio has isolated configuration
- **🔒 Server-Side Decryption**: Keys only decrypted in backend
- **🛡️ CORS Protection**: Proper CORS headers for cross-origin requests

## 📊 **Database Schema**

- **`configs` Collection**: Plugin configurations per Studio
- **`generations` Collection**: Content generation history and status
- **Encrypted Fields**: `notionClientSecret`, `llmApiKey`, `sanityToken`

This architecture provides a complete content automation pipeline from Notion planning to Sanity publishing with full editorial control and multi-tenant support! 🚀
