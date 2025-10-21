# Sanity Notion LLM Plugin

A reusable Sanity plugin that connects Notion tables with LLM to generate article drafts. This monorepo contains a Next.js backend for Notion integration, a Sanity Studio that consumes the plugin, and a frontend blog to display content.

## Project Structure

```
├── apps/
│   ├── backend/          # Next.js API backend (server-side only)
│   ├── studio/           # Sanity Studio consuming the plugin
│   │   └── plugin-project/  # Actual Sanity Studio project
│   └── frontend/         # Next.js blog frontend (customer-facing)
├── packages/
│   └── sanity-notion-llm-plugin/  # Reusable Sanity plugin
├── package.json          # Root workspace configuration
└── tsconfig.json         # TypeScript configuration
```

## Current Status

✅ **Backend**: Notion API integration working  
✅ **Studio**: Sanity Studio with plugin loading  
✅ **Frontend**: Blog displaying Sanity content  
✅ **Plugin**: Basic plugin structure created  
🔄 **Next**: Connect all components together

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` and add your Notion API credentials:

```env
# Notion API Configuration
NOTION_API_KEY=secret_your_notion_integration_token
NOTION_DATABASE_ID=your_database_id_here
```

### 3. Start Development Servers

```bash
# Start the backend (Notion API)
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

### Notion Table

- `GET /api/notion/table` - Read and transform Notion database content

**Response:**

```json
{
  "database": {
    "id": "database_id",
    "title": "Database Name",
    "properties": ["Name", "Status", "Tags"]
  },
  "pages": [
    {
      "id": "page_id",
      "url": "notion_url",
      "title": "Page Title",
      "properties": {
        "Name": "Article Title",
        "Status": "Published",
        "Tags": ["tag1", "tag2"]
      }
    }
  ]
}
```

### Notion Status Update

- `PATCH /api/notion/status` - Update the status of a Notion page

**Request Body:**

```json
{
  "pageId": "page_id_here",
  "status": "In Progress",
  "propertyName": "Status"
}
```

**Response:**

```json
{
  "page": {
    "id": "page_id",
    "url": "notion_url",
    "title": "Page Title",
    "properties": {
      "Status": "In Progress",
      "Area": "AI"
    }
  }
}
```

## Notion Setup

1. Create a Notion integration at https://www.notion.so/my-integrations
2. Copy the integration token to `NOTION_API_KEY`
3. Share your database with the integration
4. Copy the database ID from the URL to `NOTION_DATABASE_ID`

## Development

### Type Checking

```bash
npm run type-check
```

### Building

```bash
npm run build
```

## Tech Stack

- **Backend**: Next.js 15 (App Router), TypeScript
- **Studio**: Sanity v3, React, @sanity/ui
- **Frontend**: Next.js 15, React, Tailwind CSS v4
- **APIs**: Notion API, Sanity API
- **Styling**: Tailwind CSS v4 (PostCSS plugin approach)

## Architecture

Clean separation of concerns:

1. **Backend** (`apps/backend`): Server-side API for Notion integration

   - Handles Notion API calls
   - Transforms data for consumption
   - Provides REST endpoints

2. **Studio** (`apps/studio/plugin-project`): Content management interface

   - Sanity Studio for content editing
   - Plugin integration for Notion workflow
   - Multi-tenant API key management

3. **Frontend** (`apps/frontend`): Customer-facing blog

   - Displays Sanity content
   - Responsive design with Tailwind v4
   - Static generation for performance

4. **Plugin** (`packages/sanity-notion-llm-plugin`): Reusable Sanity tool
   - Custom Studio tool for Notion integration
   - Configurable for different projects
   - Handles API key encryption/decryption

## Testing

### Backend API Testing

1. Start the backend: `cd apps/backend && npm run dev`
2. Test Notion table: `GET http://localhost:3001/api/notion/table`
3. Test status update: `PATCH http://localhost:3001/api/notion/status` with JSON body

### Studio Testing

1. Start the Studio: `cd apps/studio/plugin-project && npm run dev`
2. Visit http://localhost:3333
3. Verify "Notion LLM" plugin appears in navigation
4. Create/edit blog posts in the Studio

### Frontend Testing

1. Start the frontend: `cd apps/frontend && npm run dev`
2. Visit http://localhost:3000
3. Verify blog posts from Sanity are displayed
4. Test individual post pages

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
```

## Next Steps

- [ ] Connect plugin to backend API
- [ ] Add encrypted API key storage in Sanity
- [ ] Implement Notion data display in Studio
- [ ] Add LLM integration for content generation
- [ ] Create field mapping between Notion and Sanity
