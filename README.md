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

✅ **Backend**: Clean service layer with comprehensive documentation and error handling  
✅ **Studio**: Dynamic schema detection with LLM-aware field mapping  
✅ **Frontend**: Blog displaying Sanity content  
✅ **Plugin**: Multi-tenant configuration with modular component architecture  
✅ **Database**: MongoDB Atlas with encrypted API keys and draft metadata tracking  
✅ **LLM Integration**: Generates drafts from Notion content with field-aware prompts  
✅ **Draft Management**: Complete status tracking system with MongoDB metadata  
✅ **General Tab**: Dashboard statistics and comprehensive draft list interface  
✅ **Schema Detection**: Automatically detects Sanity schema fields and types  
✅ **Code Quality**: Comprehensive cleanup with detailed documentation  
✅ **Complete**: Full content automation pipeline from Notion → LLM → Sanity

## Architecture Overview

### Clean Multi-Tenant Architecture

- **Service Layer**: Centralized business logic in `apps/backend/src/lib/services/`
- **Database Layer**: MongoDB Atlas with encrypted API key storage
- **Multi-Tenant**: Each Studio instance has isolated configuration
- **API Client**: Plugin communicates with backend via REST API
- **Scheduler**: Vercel Cron Jobs for automated content generation

### Content Flow

1. **Generation**: Create drafts from Notion content using LLM
2. **Review Period**: Editors review drafts in Studio General tab, approve or reject
3. **Status Tracking**: MongoDB tracks draft status (pending_review → approved → published)
4. **Publish Date**: Cron publishes approved drafts when date matches
5. **Notion Sync**: Status updated to "Published" after successful publish

### Key Features

- 🔐 **Secure**: API keys encrypted in MongoDB, decrypted server-side
- 🏢 **Multi-Tenant**: Each Studio can have separate Notion/LLM/Sanity configurations
- 🔄 **Automated**: Two-phase scheduling (generate week ahead, publish on date)
- 🎯 **Dynamic**: Auto-detects Sanity schemas and field types with LLM-aware mapping
- 📊 **Persistent**: Configuration saved to MongoDB, not localStorage
- 🤖 **LLM Integration**: Mistral API for intelligent content generation with field purposes
- ✨ **Auto-Save**: Field mappings automatically save on changes
- 🧩 **Modular**: Clean component architecture with comprehensive documentation
- 📝 **Draft Management**: Complete status tracking with MongoDB metadata
- 📈 **Dashboard**: Real-time statistics and draft overview in General tab
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
2. Navigate to "Notion LLM" tool
3. Go to "Settings" tab
4. Enter your Notion Database ID and Client Secret
5. Enter your LLM API Key (Mistral) and select model
6. Enter your Sanity Project ID, API Token, and Dataset
7. Click "Save Configuration" then "Test Connection"

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
2. View dashboard statistics and draft list
3. Filter drafts by status using the dropdown
4. Click "Approve" to mark for publishing on scheduled date
5. Click "Reject" to remove from publishing queue
6. View status badges and planned publish dates

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

- **`draft_metadata`**: Draft status tracking
  - `notionPageId` (string)
  - `sanityDraftId` (string)
  - `sanityDocumentType` (string)
  - `studioId` (string)
  - `status` (string: pending_review|approved|published|rejected)
  - `plannedPublishDate` (string)
  - `generatedAt` (Date)
  - `approvedAt` (Date, optional)
  - `publishedAt` (Date, optional)
  - `rejectedAt` (Date, optional)

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

- **`ConfigService`**: Multi-tenant configuration management with encrypted API keys
- **`NotionService`**: Notion API integration and content extraction utilities
- **`LLMService`**: Mistral API integration with field-aware prompt engineering
- **`SanityService`**: Sanity CMS document creation and approval workflow
- **`SchemaService`**: Dynamic Sanity schema detection and content conversion
- **`EncryptionService`**: AES-256-GCM API key encryption/decryption

### Database Layer (`apps/backend/src/lib/database/`)

- **`connection.ts`**: MongoDB connection singleton
- **`models.ts`**: Collection interfaces and indexes

### Shared Package (`packages/shared/`)

- **Types**: Common TypeScript interfaces and generation types
- **Constants**: Error messages and default values
- **Utils**: Shared utility functions for content extraction

### Plugin Components (`packages/sanity-notion-llm-plugin/src/components/`)

- **`GeneralTabContent`**: Dashboard statistics and draft management overview
- **`DashboardStats`**: Real-time statistics display with status counts
- **`DraftList`**: Comprehensive draft list with filtering and actions
- **`FieldsTabContent`**: Dynamic schema selection and field configuration
- **`SettingsTabContent`**: API configuration and connection testing
- **`GenerateTabContent`**: Content generation interface
- **`SimpleFieldCard`**: Individual field toggle and purpose input
- **`ApiConfigSection`**: API credentials input form
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

### Draft Management System (Latest)

- ✅ **General Tab**: New overview tab with dashboard statistics and draft list
- ✅ **Status Tracking**: MongoDB metadata collection for draft status management
- ✅ **Dashboard Stats**: Real-time statistics display with status counts
- ✅ **Draft List**: Comprehensive draft management with filtering and actions
- ✅ **UI Improvements**: Better spacing and visual hierarchy using Sanity UI
- ✅ **Watch Mode**: Development workflow with automatic rebuilding

### Code Cleanup & Documentation

- ✅ **Removed unused imports** and dead code throughout the codebase
- ✅ **Cleaned up debug logs** while keeping essential error logging
- ✅ **Added comprehensive documentation** to all service files
- ✅ **Updated component documentation** with detailed usage information
- ✅ **Improved README** with current architecture and features
- ✅ **Enhanced code quality** with better comments and structure

### LLM-Aware Dynamic Field Mapping

- ✅ **Dynamic Schema Detection**: Automatically detects Sanity schema fields
- ✅ **Field-Aware Generation**: LLM uses field purposes for better content
- ✅ **Simplified Configuration**: No more manual field mapping required
- ✅ **Auto-save**: Field configurations save automatically

## What's Next

### Phase 2: Advanced Features

- [ ] Content scheduling based on Notion dates
- [ ] Batch processing
- [ ] Content templates
- [ ] Analytics and monitoring

### Phase 3: Production Features

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
