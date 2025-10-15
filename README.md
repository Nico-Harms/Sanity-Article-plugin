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
NOTION_API_KEY=your_notion_integration_token_here
NOTION_DATABASE_ID=your_notion_database_id_here
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

### Notion API

- `GET /api/notion/table` - Read and transform Notion database content

**Response Format:**

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

### Linting

```bash
npm run lint
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
