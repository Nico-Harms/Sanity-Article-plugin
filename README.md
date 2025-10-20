# Sanity Notion LLM Plugin

A reusable Sanity plugin that connects Notion tables with LLM to generate article drafts. This monorepo contains a Next.js backend for Notion integration and a Sanity Studio that consumes the plugin.

## Project Structure

```
├── apps/
│   ├── backend/          # Next.js API backend (server-side only)
│   └── studio/           # Sanity Studio consuming the plugin
├── packages/
│   └── sanity-notion-llm-plugin/  # Reusable Sanity plugin
├── package.json          # Root workspace configuration
└── tsconfig.json         # TypeScript configuration
```

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

### 3. Start Development Server

```bash
# Start the backend
npm run dev

# Or start from the backend directory
cd apps/backend
npm run dev
```

The backend will be available at http://localhost:3001

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

- **Backend**: Next.js 14 (App Router), TypeScript
- **APIs**: Notion API
- **Styling**: Tailwind CSS v4 (no config files needed!)

## Architecture

Simple and focused:

1. **Notion Integration**: Fetches content from Notion databases
2. **Data Transformation**: Converts Notion properties to readable format
3. **Clean API**: Returns structured JSON for easy consumption

## Testing

1. Start the backend: `npm run dev`
2. Test the Notion table endpoint: `GET http://localhost:3001/api/notion/table`
3. Test status update: `PATCH http://localhost:3001/api/notion/status` with JSON body
4. Verify data structure matches your Notion database

## Development

### Backend Development

```bash
cd apps/backend
npm run dev
```

### Studio Development

```bash
cd apps/studio
npm run dev
```

## Next Steps

- Build Sanity plugin with @sanity/plugin-kit
- Create Studio app that consumes the plugin
- Add encrypted API key storage in Sanity
- Integrate LLM wrapper for content generation
