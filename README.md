# Notion API Backend

A simple Next.js backend for reading Notion database tables and extracting structured content.

## Project Structure

```
├── apps/
│   └── backend/          # Next.js API backend for Notion integration
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

### Health Check

- `GET /api/health` - Check if the backend is running

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

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
2. Visit http://localhost:3001
3. Click "Test Health" → Should return `{ status: 'ok' }`
4. Click "Fetch Notion Data" → Should return database + pages
5. Verify data structure matches your Notion database

## Next Steps

Once Notion integration is working:

- Add encryption layer for API keys
- Build Sanity plugin
- Integrate encrypted key storage
- Add LLM wrapper for content generation
