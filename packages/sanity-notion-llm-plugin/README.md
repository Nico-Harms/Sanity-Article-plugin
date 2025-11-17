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

### 2. Set Backend URL

```env
SANITY_STUDIO_BACKEND_URL=https://your-backend-api.com
```

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
