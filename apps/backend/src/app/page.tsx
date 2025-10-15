export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Notion API Backend</h1>
        <p className="text-lg text-gray-600 mb-8">
          Simple backend for reading Notion database tables and extracting
          structured content.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Read Notion Table</h2>
            <p className="text-gray-600 mb-4">
              Fetch and transform data from your Notion database into clean JSON
              format.
            </p>
            <a
              href="/api/notion/table"
              className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Notion API
            </a>
          </div>

          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Setup Instructions</h2>
            <p className="text-gray-600 mb-4">
              Configure your Notion API key and database ID in the environment
              variables.
            </p>
            <div className="text-sm text-gray-500 mt-2">
              <p>Required: NOTION_API_KEY, NOTION_DATABASE_ID</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
