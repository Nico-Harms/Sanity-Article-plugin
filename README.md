# Sanity Notion LLM Plugin

A production-ready, multi-tenant Sanity plugin that connects Notion tables with LLM to automatically generate article drafts. Features clean service layer architecture, MongoDB persistence, and automated content generation scheduling.

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

✅ **Backend**: Clean service layer with LLM integration and Sanity document creation  
✅ **Studio**: Draft review workflow with approval UI and auto-save field mappings  
✅ **Frontend**: Blog displaying Sanity content  
✅ **Plugin**: Multi-tenant configuration with modular component architecture  
✅ **Database**: MongoDB Atlas with encrypted API keys (Notion, LLM, Sanity)  
✅ **LLM Integration**: Mistral API integration with content generation  
✅ **Code Quality**: 24% code reduction through component extraction and cleanup  
🔄 **Next**: Sanity document creation and automated publishing workflow

## Architecture Overview

### Clean Multi-Tenant Architecture

- **Service Layer**: Centralized business logic in `apps/backend/src/lib/services/`
- **Database Layer**: MongoDB Atlas with encrypted API key storage
- **Multi-Tenant**: Each Studio instance has isolated configuration
- **API Client**: Plugin communicates with backend via REST API
- **Scheduler**: Vercel Cron Jobs for automated content generation

### Key Features

- 🔐 **Secure**: API keys encrypted in MongoDB, decrypted server-side
- 🏢 **Multi-Tenant**: Each Studio can have separate Notion/LLM/Sanity configurations
- 🔄 **Automated**: Scheduled content generation based on Notion dates
- 🎯 **Dynamic**: Auto-detects Sanity schemas and suggests field mappings
- 📊 **Persistent**: Configuration saved to MongoDB, not localStorage
- 🤖 **LLM Integration**: Mistral API for intelligent content generation
- ✨ **Auto-Save**: Field mappings automatically save on changes
- 🧩 **Modular**: Clean component architecture with separated concerns

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

- `POST /api/generate` - Generate article drafts from Notion content

### Scheduled Content Generation

- `GET /api/cron/generate-content` - Vercel Cron endpoint (placeholder)

## Plugin Usage

### 1. Configure API Settings

1. Open Sanity Studio
2. Navigate to "Notion LLM" tool
3. Go to "Settings" tab
4. Enter your Notion Database ID and Client Secret
5. Enter your LLM API Key (Mistral) and select model
6. Click "Save Configuration" then "Test Connection"

### 2. Map Fields

1. Go to "Fields" tab
2. Select your content schema (e.g., "article", "blogPost")
3. Map logical fields to schema fields:
   - **Title** → `title` field
   - **Body Content** → `body` field
   - **Slug** → `slug` field
   - **Main Image** → `mainImage` field
   - etc.
4. Field mappings auto-save when you make changes

### 3. Generate Content

1. Go to "Generate" tab
2. Select a Notion page from the dropdown
3. Click "Generate Draft" to create content using LLM
4. Review the generated content in the preview

## Database Schema

### Collections

- **`configs`**: Plugin configurations per Studio
  - `studioId` (string, unique)
  - `notionDatabaseUrl` (string)
  - `notionClientSecret` (string, encrypted)
  - `llmApiKey` (string, encrypted)
  - `llmModel` (string)
  - `sanityProjectId` (string, encrypted)
  - `sanityToken` (string, encrypted)
  - `sanityDataset` (string)
  - `selectedSchema` (string)
  - `fieldMappings` (array)
  - `isActive` (boolean)

- **`generations`**: Content generation history
  - `configId` (ObjectId)
  - `notionPageId` (string)
  - `scheduledDate` (Date)
  - `status` (string)
  - `sanityDocumentId` (string)

## Tech Stack

- **Backend**: Next.js 15 (App Router), TypeScript, MongoDB
- **Studio**: Sanity v3, React, @sanity/ui
- **Frontend**: Next.js 15, React, Tailwind CSS v4
- **Database**: MongoDB Atlas
- **APIs**: Notion API, Sanity API, Mistral API
- **Encryption**: AES-256-GCM for API key security
- **Scheduling**: Vercel Cron Jobs

## Service Layer Architecture

### Backend Services (`apps/backend/src/lib/services/`)

- **`ConfigService`**: Configuration CRUD operations
- **`NotionService`**: Notion API integration and content extraction
- **`LLMService`**: Mistral API integration for content generation
- **`EncryptionService`**: AES-256-GCM API key encryption/decryption

### Database Layer (`apps/backend/src/lib/database/`)

- **`connection.ts`**: MongoDB connection singleton
- **`models.ts`**: Collection interfaces and indexes

### Shared Package (`packages/shared/`)

- **Types**: Common TypeScript interfaces and generation types
- **Constants**: Error messages and default values
- **Utils**: Shared utility functions for content extraction

### Plugin Components (`packages/sanity-notion-llm-plugin/src/components/`)

- **`FieldsTabContent`**: Schema selection and field mapping
- **`SettingsTabContent`**: API configuration and connection testing
- **`GenerateTabContent`**: Content generation interface
- **`FieldMappingCard`**: Individual field mapping controls
- **`ApiConfigSection`**: API credentials input form

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

# Test cron endpoint
curl -H "Authorization: Bearer your-cron-secret" \
     "http://localhost:3001/api/cron/generate-content"
```

## What's Next

### Phase 2: Sanity Document Creation & Approval Workflow

- [ ] SanityService for document management
- [ ] Per-studio encrypted Sanity credentials
- [ ] Draft creation after LLM generation
- [ ] Draft review UI in Studio plugin
- [ ] Approval workflow with approve/reject actions
- [ ] Two-phase cron: generate drafts → publish approved

### Phase 3: Advanced Features

- [ ] Content scheduling based on Notion dates
- [ ] Batch processing
- [ ] Content templates
- [ ] Analytics and monitoring

### Phase 4: Production Features

- [ ] Rate limiting
- [ ] Caching
- [ ] Monitoring and alerts
- [ ] Performance optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
