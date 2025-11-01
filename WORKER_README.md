# CVGen Cloudflare Worker

This is the Cloudflare Workers implementation of CVGen - a professional CV/Resume generator with AI-powered insights.

## Features

- 🚀 **API Endpoints**: RESTful API for CV generation
- 📄 **Multiple Formats**: Generate HTML, PDF, and Markdown
- 💾 **R2 Storage**: Store CV assets in Cloudflare R2
- 🗄️ **D1 Database**: Log all requests with full payload
- 🤖 **AI Agent**: RAG-powered career advisor
- 🔍 **Vector Search**: Semantic search through CV history
- 🌐 **Frontend**: Web interface matching original functionality
- 📚 **OpenAPI**: Auto-generated API documentation

## Setup

### Prerequisites

- Node.js 18+
- Cloudflare account
- Wrangler CLI installed

### Installation

```bash
npm install
```

### Cloudflare Resources Setup

1. **Create D1 Database**:
```bash
wrangler d1 create cvgen-db
```

Update `wrangler.toml` with the database ID returned.

2. **Initialize Database**:
```bash
npm run worker:init-db
```

3. **Create R2 Bucket**:
```bash
wrangler r2 bucket create cv-assets
```

4. **Create Vectorize Index**:
```bash
wrangler vectorize create cv-embeddings --dimensions=768 --metric=cosine
```

Update `wrangler.toml` with the index name.

### Development

Build and run locally:

```bash
npm run build
npm run dev
```

Visit `http://localhost:8787` to access the frontend.

### Deployment

```bash
npm run build
npm run deploy
```

## API Endpoints

### Generate CV
```http
POST /api/generate
Content-Type: application/json

{
  "profile": {
    "name": "John Doe",
    "position": "Software Engineer",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "summary": "Experienced developer...",
  "education": [...],
  "skills": {...}
}
```

**Response**:
```json
{
  "id": "uuid",
  "html_url": "https://...",
  "pdf_url": "https://...",
  "markdown_url": "https://...",
  "created_at": "2024-11-01T..."
}
```

### List CVs
```http
GET /api/cvs?limit=50&offset=0
```

### Get Specific CV
```http
GET /api/cvs/{id}
```

### Chat with AI Agent
```http
POST /api/chat
Content-Type: application/json

{
  "message": "What skills have I used most in my CVs?",
  "conversation_history": []
}
```

### Search CVs
```http
GET /api/search?q=javascript&limit=10
```

## OpenAPI Documentation

- JSON: `GET /openapi.json`
- YAML: `GET /openapi.yaml`

## Frontend Pages

- **Editor**: `/` - Create and preview CVs
- **History**: `/history` - View all generated CVs
- **Chat**: `/chat` - AI career advisor interface

## Architecture

```
worker/
├── src/
│   ├── index.ts              # Main entry point
│   ├── types/                # TypeScript type definitions
│   ├── schema/               # Zod validation schemas
│   ├── api/
│   │   ├── routes.ts         # API route handlers
│   │   └── openapi.ts        # OpenAPI schema generation
│   ├── services/
│   │   ├── cv-generator.ts   # CV generation logic
│   │   ├── storage.ts        # R2 storage service
│   │   ├── database.ts       # D1 database service
│   │   ├── vectorize.ts      # Vectorize service
│   │   └── ai-agent.ts       # AI agent service
│   └── frontend/
│       ├── pages.ts          # Frontend HTML pages
│       ├── css/              # Styles
│       ├── js/               # Client-side JS
│       └── img/              # Images
└── schema.sql                # D1 database schema
```

## Environment Variables

Set in `.dev.vars` for local development:

```
# No API keys required - all services use Cloudflare bindings
```

## Configuration

Update `wrangler.toml` with your resource IDs:

```toml
[[r2_buckets]]
binding = "CV_ASSETS"
bucket_name = "cv-assets"

[[d1_databases]]
binding = "DB"
database_name = "cvgen-db"
database_id = "your-database-id"

[[vectorize]]
binding = "VECTORIZE"
index_name = "cv-embeddings"
```

## Features

### Browser Rendering for PDF

Uses Cloudflare Browser Rendering to generate PDFs from HTML. Requires enabling Browser Rendering in your Cloudflare account.

### AI-Powered Insights

The AI agent uses:
- **Vectorize**: For semantic search through CV content
- **AI Gateway**: For LLM inference
- **RAG**: Retrieval-augmented generation for context-aware responses

### Automatic Vectorization

Every CV generated is automatically:
1. Chunked into searchable segments
2. Embedded using `@cf/baai/bge-base-en-v1.5`
3. Stored in Vectorize for semantic search
4. Indexed in D1 for metadata queries

## Development Tips

1. **Local Testing**: Use `wrangler dev` for local development
2. **Database Migrations**: Update `worker/schema.sql` and run `npm run worker:init-db`
3. **TypeScript**: Run `npm run build` to compile TypeScript
4. **Logs**: Use `wrangler tail` to view production logs

## Troubleshooting

**Browser Rendering not available**:
- Enable in Cloudflare dashboard
- Check browser binding configuration

**D1 Database errors**:
- Ensure database is created and initialized
- Check database ID in `wrangler.toml`

**R2 Storage issues**:
- Verify bucket exists and is accessible
- Check bucket permissions

## License

MIT License - See LICENSE file for details
