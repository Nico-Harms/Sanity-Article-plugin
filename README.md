# Hermés - Sanity Notion LLM Plugin

An intelligent Sanity plugin that turns your Notion content plan into AI-written articles. It bridges Notion, LLMs (OpenAI, Mistral, Gemini, Perplexity), and Sanity CMS into one automated workflow.

**Core Goal:** Automate content publishing by connecting Notion → LLM → Sanity in a clean, configurable way.

## ✨ Key Features

- **🤖 Multi-LLM Support**: Choose between OpenAI, Mistral, Gemini, or Perplexity.
- **🔗 Notion Sync**: Bidirectional status updates (Waiting → In Progress → Approved → Published).
- **🧩 Smart Schema Detection**: Automatically detects your Sanity fields and maps content intelligently.
- **🛡️ Secure & Multi-Tenant**: API keys are encrypted; supports multiple Studio configurations.
- **📅 Automated Workflow**: Schedule drafts to generate on Mondays and publish throughout the week.
- **✍️ Clean Content**: Automatically converts Markdown to Sanity Portable Text (headings, bold, links, lists).

## 🚀 Quick Start

### 1. Install & Setup

```bash
# Install dependencies
npm install

# Start development servers
npm run dev:all
```

This starts:

- **Backend API**: `http://localhost:3001`
- **Sanity Studio**: `http://localhost:3333`
- **Frontend Blog**: `http://localhost:3000`

### 2. Environment Variables

**Backend** (`apps/backend/.env.local`):

```env
MONGODB_URI=your_mongodb_connection_string
ENCRYPTION_SECRET=your_32_char_secret_key
CRON_SECRET=your_cron_secret
```

**Studio** (`apps/studio/plugin-project/.env.local`):

```env
SANITY_STUDIO_BACKEND_URL=http://localhost:3001
```

## 📖 How It Works

### 1. Configure the Plugin

Open Sanity Studio → **Hermés** tool → **Settings** tab.

- Enter Notion Database ID & Client Secret.
- Choose your LLM Provider & API Key.
- Connect your Sanity Project.

### 2. Map Your Fields

Go to the **Fields** tab.

- Select your article schema (e.g., `post` or `article`).
- Toggle which fields the AI should generate.
- Add brief instructions (e.g., "Write a catchy intro").

### 3. Generate Content

Go to the **Generate** tab.

- Select a page from your Notion plan.
- Click **Generate Draft**.
- The AI writes the article based on your Notion brief.

### 4. Review & Publish

Go to the **General** tab.

- Review the generated draft.
- Click **Approve** to schedule it for publishing.
- The Notion status automatically updates to "Approved".

## 🛠️ Architecture

The project is a monorepo using **NPM Workspaces**:

- **`apps/backend`**: Next.js API handling LLM generation, database, and encryption.
- **`apps/studio`**: Sanity Studio with the custom plugin installed.
- **`apps/frontend`**: Example Next.js blog displaying the content.
- **`packages/sanity-notion-llm-plugin`**: The reusable plugin UI code.
- **`packages/shared`**: Shared types and utilities.

### Database (MongoDB)

- Stores plugin configurations securely.
- Tracks draft lifecycles and synchronization status.
- **Security**: API keys are encrypted using AES-256-GCM.

## 🔄 Automated Scheduling

The system is designed for a weekly editorial rhythm:

1. **Monday**: Cron job generates drafts for all "Waiting" Notion items.
2. **Mid-week**: Editors review and approve drafts in Sanity.
3. **Daily**: Cron job publishes approved drafts on their scheduled dates.

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes.
4. Open a Pull Request.

## License

MIT License.
