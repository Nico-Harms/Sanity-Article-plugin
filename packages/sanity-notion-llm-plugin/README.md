# Sanity Hermes

A Sanity Studio plugin that connects Notion tables with LLM to generate article drafts.

## Installation

```bash
npm install sanity-hermes
```

## Setup

### 1. Add to Sanity Config

```typescript
import { defineConfig } from 'sanity';
import { sanityNotionLLMPlugin } from 'sanity-hermes';

export default defineConfig({
  plugins: [sanityNotionLLMPlugin()],
});
```

### 2. Set Backend URL (Optional)

The plugin connects to the production backend by default. To use a different backend, set:

```env
SANITY_STUDIO_BACKEND_URL=https://sanity-notion-llm-api.vercel.app
```

**Default**: `https://sanity-notion-llm-api.vercel.app` (production)
**Development**: Set to `http://localhost:3001` if running backend locally

### 3. Configure in Studio

1. Open "Hermes Content" tool
2. Go to "Settings" tab
3. Enter Notion, LLM, and Sanity credentials
4. Map fields in "Fields" tab
5. Generate drafts in "Generate" tab

## Requirements

- Sanity v3+ or v4+
- React v18+ or v19+
- Node >=18.0.0
- Backend API server

## License
