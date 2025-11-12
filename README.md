# Hermés - Sanity Notion LLM Plugin

A production-ready, multi-tenant Sanity plugin that bridges Notion content planning with AI-powered article generation. Supports multiple LLM providers (OpenAI, Mistral, Gemini, Perplexity), features intelligent Notion sync, and provides complete content automation from planning to publishing.

## Project Structure

```
├── apps/
│   ├── backend/          # Next.js API backend with service layer
│   ├── studio/           # Sanity Studio consuming the plugin
│   │   └── plugin-project/  # Actual Sanity Studio project
│   └── frontend/         # Next.js blog frontend (customer-facing)
├── packages/
│   ├── shared/           # Shared types and constants
│   └── sanity-notion-llm-plugin/  # Reusable Sanity plugin
├── package.json          # Root workspace configuration
└── tsconfig.json         # TypeScript configuration
```

## Current Status

✅ **Multi-LLM Support**: OpenAI, Mistral, Gemini, and Perplexity with dynamic model selection  
✅ **Backend**: Clean service layer with comprehensive documentation and error handling  
✅ **Studio**: Dynamic schema detection with LLM-aware field mapping  
✅ **Frontend**: Blog displaying Sanity content  
✅ **Plugin**: Multi-tenant configuration with modular component architecture  
✅ **Database**: MongoDB Atlas with encrypted API keys and draft metadata tracking  
✅ **Notion Sync**: Bidirectional status updates (In progress → Approved → Published)  
✅ **Draft Management**: Complete lifecycle tracking with intelligent status display  
✅ **General Tab**: Dashboard statistics with published article handling  
✅ **Schema Detection**: Automatically detects Sanity schema fields and types  
✅ **Dynamic Content Preview**: Structure-based formatting for any Sanity schema  
✅ **Automated Publishing**: Cron-based content generation and publishing workflow  
✅ **Complete**: Full content automation pipeline from Notion → LLM → Sanity

## Architecture Overview

### Clean Multi-Tenant Architecture

- **Service Layer**: Centralized business logic in `apps/backend/src/lib/services/`
- **Database Layer**: MongoDB Atlas with encrypted API key storage
- **Multi-Tenant**: Each Studio instance has isolated configuration
- **API Client**: Plugin communicates with backend via REST API
- **Scheduler**: Vercel Cron Jobs for automated content generation

### Content Flow

1. **Notion Planning**: Content managers create articles with "Waiting to generate" status in Notion
2. **Monday Generation**: Automated cron generates drafts for the week → Notion status: "In progress"
3. **Editorial Review**: Editors review drafts in Studio General tab with structure-based content preview
4. **Approval**: Approved drafts ready for publishing → Notion status: "Approved"
5. **Automated Publishing**: Daily cron publishes approved drafts on scheduled date → Notion status: "Published"
6. **Status Sync**: Full lifecycle tracked in MongoDB with bidirectional Notion status updates

### Key Features

- 🔐 **Secure**: API keys encrypted in MongoDB, decrypted server-side
- 🏢 **Multi-Tenant**: Each Studio can have separate Notion/LLM/Sanity configurations
- 🤖 **Multi-LLM**: Support for OpenAI (GPT-4), Mistral, Google Gemini, and Perplexity
- 🔄 **Automated**: Two-phase scheduling (Monday generation, daily publishing)
- 🎯 **Dynamic**: Auto-detects Sanity schemas and field types with LLM-aware mapping
- 📊 **Persistent**: Configuration saved to MongoDB, not localStorage
- 🔗 **Notion Sync**: Bidirectional status updates throughout content lifecycle
- ✨ **Auto-Save**: Field mappings automatically save on changes
- 🧩 **Modular**: Clean component architecture with comprehensive documentation
- 📝 **Draft Management**: Complete lifecycle tracking (Pending → Approved → Published)
- 📈 **Dashboard**: Real-time statistics with intelligent status display
- 🎨 **Smart Preview**: Structure-based content formatting for any schema
- 📚 **Well-Documented**: Comprehensive documentation for all services and components

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster (M0)
3. Create a database user with read/write permissions
4. Whitelist your IP address (0.0.0.0/0 for development)
5. Get your connection string

### 3. Set Up Environment Variables

#### Backend Environment (`apps/backend/.env.local`)

```env
# MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/notion-llm-plugin

# Encryption secret for API keys (32+ characters)
ENCRYPTION_SECRET=your-32-character-secret-key-here

# Vercel Cron secret (for production)
CRON_SECRET=your-cron-secret-here
```

#### Studio Environment (`apps/studio/plugin-project/.env.local`)

```env
# Backend API URL for the Notion LLM plugin
SANITY_STUDIO_BACKEND_URL=http://localhost:3001
```

### 4. Start Development Servers

```bash
# Start the backend (API + Database)
cd apps/backend
npm run dev
# Available at http://localhost:3001

# Start the Studio (content management)
cd apps/studio/plugin-project
npm run dev
# Available at http://localhost:3333

# Start the frontend (blog)
cd apps/frontend
npm run dev
# Available at http://localhost:3000
```

## Development URLs

- **Backend API**: http://localhost:3001
- **Sanity Studio**: http://localhost:3333
- **Blog Frontend**: http://localhost:3000

## API Endpoints

### Configuration Management

- `GET /api/config?studioId={id}` - Load plugin configuration
- `POST /api/config` - Save plugin configuration (with encrypted API keys)

### Notion Integration

- `GET /api/notion/table?studioId={id}` - Read Notion database content
- `PATCH /api/notion/status?studioId={id}` - Update Notion page status

### LLM Content Generation

- `POST /api/generate` - Generate article drafts from Notion content and create Sanity documents

### Draft Management

- `GET /api/drafts?studioId={id}` - Fetch draft documents with metadata for review
- `GET /api/drafts/stats?studioId={id}` - Get dashboard statistics
- `POST /api/drafts/approve` - Approve a draft for publishing
- `POST /api/drafts/reject` - Reject a draft

### Scheduled Content Generation

- `GET /api/cron/generate-content` - Two-phase cron: generate drafts (week ahead) and publish approved (today)

## Plugin Usage

### 1. Configure API Settings

1. Open Sanity Studio
2. Navigate to "Hermés" tool
3. Go to "Settings" tab
4. Enter your Notion Database ID and Client Secret
5. Select your LLM Provider (OpenAI, Mistral, Gemini, or Perplexity)
6. Enter your LLM API Key and select model from available options
7. Enter your Sanity Project ID, API Token, and Dataset
8. Click "Save Configuration" then "Test Connection"

### 2. Configure Field Mapping

1. Go to "Fields" tab
2. Select your content schema (e.g., "article", "blogPost")
3. The plugin automatically detects all fields in your schema
4. Toggle fields on/off for content generation
5. Add purpose descriptions for each field (e.g., "Main article introduction", "Expert quote")
6. Field configurations auto-save when you make changes

### 3. Generate Content

1. Go to "Generate" tab
2. Select a Notion page from the dropdown
3. Click "Generate Draft" to create content using LLM
4. Review the generated content in the preview
5. Draft is automatically created in Sanity CMS

### 4. Review and Approve Drafts

1. Go to "General" tab (first tab)
2. View dashboard statistics showing all draft statuses
3. Filter drafts by status: Pending Review, Approved, Published
4. Click on a draft to preview content with smart structure-based formatting
5. Click "Approve" to mark for publishing on scheduled date → Notion status: "Approved"
6. View "Open in Sanity" button to edit drafts directly in Sanity Studio
7. Published articles remain visible with "Published on: [date]" label

## Database Schema

### Collections

- **`configs`**: Plugin configurations per Studio
  - `studioId` (string, unique)
  - `notionDatabaseUrl` (string)
  - `notionClientSecret` (string, encrypted)
  - `llmProvider` (string: openai|mistral|gemini|perplexity)
  - `llmApiKey` (string, encrypted)
  - `llmModel` (string)
  - `sanityProjectId` (string, encrypted)
  - `sanityToken` (string, encrypted)
  - `sanityDataset` (string)
  - `selectedSchema` (string)
  - `fieldMappings` (array)
  - `systemInstructions` (string, optional)
  - `isActive` (boolean)

- **`draft_metadata`**: Draft status tracking
  - `notionPageId` (string)
  - `sanityDraftId` (string)
  - `sanityPublishedId` (string, optional - set after publishing)
  - `sanityDocumentType` (string)
  - `studioId` (string)
  - `status` (string: pending_review|approved|published)
  - `plannedPublishDate` (string)
  - `generatedAt` (Date)
  - `approvedAt` (Date, optional)
  - `publishedAt` (Date, optional)
  - `lastSyncedAt` (Date, optional)
  - `syncStatus` (string, optional)

## Tech Stack

- **Backend**: Next.js 15 (App Router), TypeScript, MongoDB
- **Studio**: Sanity v3, React, @sanity/ui, @portabletext/react
- **Frontend**: Next.js 15, React, Tailwind CSS v4
- **Database**: MongoDB Atlas with encrypted storage
- **APIs**: Notion API, Sanity API
- **LLM Providers**: OpenAI GPT-4, Mistral AI, Google Gemini, Perplexity
- **Encryption**: AES-256-GCM for API key security
- **Scheduling**: Vercel Cron Jobs (Monday generation, daily publishing)

## Service Layer Architecture

### Backend Services (`apps/backend/src/lib/services/`)

- **`ConfigService`**: Multi-tenant configuration management with encrypted API keys
- **`NotionService`**: Notion API integration, content extraction, and status synchronization
- **`LLMService`**: Multi-provider orchestration with factory pattern
  - `OpenAIProvider`: GPT-4 and GPT-3.5-turbo support
  - `MistralProvider`: Mistral Large and Small models
  - `GeminiProvider`: Google Gemini Pro and Flash
  - `PerplexityProvider`: Perplexity Sonar models
- **`SanityService`**: Document creation, draft approval, and publishing workflow
- **`SchemaService`**: Dynamic schema detection and content conversion
- **`EncryptionService`**: AES-256-GCM API key encryption/decryption
- **`DraftMetadataService`**: Draft lifecycle tracking and status management

### Database Layer (`apps/backend/src/lib/database/`)

- **`connection.ts`**: MongoDB connection singleton
- **`models.ts`**: Collection interfaces and indexes

### Shared Package (`packages/shared/`)

- **Types**: Common TypeScript interfaces and generation types
- **Constants**: Error messages and default values
- **Utils**: Shared utility functions for content extraction

### Plugin Components (`packages/sanity-notion-llm-plugin/src/components/`)

- **`GeneralTabContent`**: Dashboard overview with statistics and draft management
- **`DashboardStats`**: Real-time statistics display with status breakdown
- **`DraftList`**: Comprehensive draft list with status filtering and actions
- **`DraftModal`**: Full-featured draft preview with content display
- **`MinimalContentFormatter`**: Structure-based content renderer for any Sanity schema
- **`FieldsTabContent`**: Dynamic schema selection and field configuration
- **`SettingsTabContent`**: API configuration and connection testing
- **`GenerateTabContent`**: Content generation interface
- **`SimpleFieldCard`**: Individual field toggle and purpose input
- **`ApiConfigSection`**: Multi-provider LLM configuration with model selection
- **`TabbedInterface`**: Main plugin navigation

## Security Features

- 🔐 **Encrypted Storage**: API keys encrypted with AES-256-GCM
- 🏢 **Multi-Tenant Isolation**: Each Studio has separate configuration
- 🔒 **Server-Side Decryption**: Keys only decrypted in backend
- 🛡️ **Input Validation**: All API inputs validated
- 🔑 **Cron Authentication**: Scheduled jobs require secret token

## Deployment

### Backend (Vercel)

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy to get your backend URL
4. Update Studio environment with production backend URL

### Studio (Sanity)

1. Deploy Studio to Sanity's hosting
2. Update environment variables
3. Configure domain and SSL

### Database (MongoDB Atlas)

1. Create production cluster
2. Configure IP whitelist for production servers
3. Set up monitoring and backups

## Development Commands

```bash
# Watch mode for all packages and apps
npm run watch:all

# Plugin development only
npm run dev:plugin

# Backend development
cd apps/backend && npm run dev

# Studio development
cd apps/studio/plugin-project && npm run dev

# Frontend development
cd apps/frontend && npm run dev

# Plugin development
cd packages/sanity-notion-llm-plugin && npm run dev

# Shared package development
cd packages/shared && npm run dev
```

## Testing

### Manual Testing Checklist

- [ ] Backend connects to MongoDB Atlas successfully
- [ ] Plugin can load configuration from backend
- [ ] Plugin can save configuration to backend
- [ ] API keys are encrypted in database
- [ ] Connection test works in plugin
- [ ] Field mappings auto-save correctly
- [ ] LLM content generation works (with valid API key)
- [ ] Sanity document creation works after LLM generation
- [ ] General tab shows dashboard statistics
- [ ] Draft list displays all drafts with proper status
- [ ] Approve/reject actions work correctly
- [ ] Cron job generates drafts for future dates
- [ ] Cron job publishes approved drafts on scheduled date
- [ ] Notion page selection shows content preview
- [ ] Multiple Studio instances can have separate configs
- [ ] Component architecture is clean and modular

### API Testing

```bash
# Test configuration loading
curl "http://localhost:3001/api/config?studioId=test-studio"

# Test Notion data loading
curl "http://localhost:3001/api/notion/table?studioId=test-studio"

# Test LLM content generation
curl -X POST "http://localhost:3001/api/generate" \
     -H "Content-Type: application/json" \
     -d '{"studioId":"test-studio","notionPageId":"page-id"}'

# Test draft management
curl "http://localhost:3001/api/drafts?studioId=test-studio"
curl "http://localhost:3001/api/drafts/stats?studioId=test-studio"
curl -X POST "http://localhost:3001/api/drafts/approve" \
     -H "Content-Type: application/json" \
     -d '{"studioId":"test-studio","documentId":"draft-id"}'

# Test cron endpoint
curl -H "Authorization: Bearer your-cron-secret" \
     "http://localhost:3001/api/cron/generate-content"
```

## Recent Updates

### Structure-Based Content Preview (Latest)

- ✅ **Smart Content Formatter**: Structure-based detection instead of string checking
- ✅ **Universal Schema Support**: Works with any Sanity schema without configuration
- ✅ **Portable Text Detection**: Automatically identifies and renders rich text
- ✅ **Object Array Handling**: Detects and displays modules, components, sections
- ✅ **Date Recognition**: Pattern-based date detection with formatting
- ✅ **Clean Preview**: Removed all debug console logs

### Multi-LLM Provider Support

- ✅ **OpenAI Integration**: GPT-4 and GPT-3.5-turbo models
- ✅ **Mistral Integration**: Mistral Large and Small models
- ✅ **Google Gemini**: Gemini Pro and Flash models
- ✅ **Perplexity**: Sonar models with web search capabilities
- ✅ **Factory Pattern**: Clean provider architecture with auto-detection
- ✅ **Dynamic UI**: Provider selection updates available models

### Notion Status Synchronization

- ✅ **Three-Phase Workflow**: Waiting to generate → In progress → Approved → Published
- ✅ **Bidirectional Sync**: Updates flow from Sanity back to Notion
- ✅ **Status Tracking**: Full lifecycle tracking in MongoDB
- ✅ **Published Handling**: Published articles remain visible with proper labels
- ✅ **Week Filtering**: Intelligent date filtering for scheduled vs. published content

### Draft Management Enhancements

- ✅ **General Tab**: Dashboard overview with real-time statistics
- ✅ **Status Filtering**: Filter by Pending Review, Approved, Published
- ✅ **Draft Preview**: Full content preview with structure-based formatting
- ✅ **Open in Sanity**: Direct links to edit drafts in Sanity Studio
- ✅ **Removed Reject**: Streamlined workflow without rejection flow

## Structure-Based Content Preview

The plugin includes an intelligent content formatter (`MinimalContentFormatter`) that automatically adapts to any Sanity schema without configuration:

### How It Works

- **Type Detection**: Analyzes JavaScript types (string, number, array, object)
- **Structure Recognition**: Identifies patterns like Portable Text blocks, object arrays, dates
- **Universal Rendering**: Works with any field names (no hardcoded checks for "slug", "modules", etc.)

### Supported Content Types

1. **Portable Text**: Automatically detects and renders rich text with `_type: 'block'`
2. **Structured Objects**: Arrays of objects (modules, components, sections) rendered as cards
3. **Dates**: Pattern-based detection (YYYY-MM-DD, MM/DD/YYYY) with formatting
4. **Simple Arrays**: Bulleted lists for primitive values
5. **Objects**: Inline display for small objects, cards for larger structures
6. **Primitives**: Strings, numbers, booleans displayed appropriately

### Detection Logic Examples

```typescript
// Portable Text Detection
const isPortableText = (value: any) => {
  return (
    Array.isArray(value) &&
    value.some((item) => ['block', 'image', 'code'].includes(item._type))
  );
};

// Structured Object Array Detection
const isStructuredObjectArray = (value: any) => {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'object')
  );
};

// Date Pattern Detection
const looksLikeDate = (value: string) => {
  return /^\d{4}-\d{2}-\d{2}/.test(value) || /T\d{2}:\d{2}:\d{2}/.test(value);
};
```

This approach ensures the preview works with **any** Sanity schema, making the plugin truly reusable!

## What's Next

### Phase 2: Advanced Features

- [ ] Batch content generation
- [ ] Content templates with variables
- [ ] Analytics and monitoring dashboard
- [ ] Advanced LLM prompt customization

### Phase 3: Production Features

- [ ] Rate limiting and quota management
- [ ] Caching for improved performance
- [ ] Monitoring and alerts for failed generations
- [ ] Performance optimization for large datasets

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
