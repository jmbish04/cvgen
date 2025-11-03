# CVGen Cloudflare Worker Deployment Guide

Complete guide to deploying CVGen on Cloudflare Workers.

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com
2. **Node.js 18+**: Install from https://nodejs.org
3. **Wrangler CLI**: Will be installed with npm dependencies

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
cd /path/to/cvgen
npm install
```

### 2. Authenticate with Cloudflare

```bash
npx wrangler login
```

This will open a browser window for authentication.

### 3. Create D1 Database

```bash
npx wrangler d1 create cvgen-db
```

**Output**:
```
✅ Successfully created DB 'cvgen-db'

[[d1_databases]]
binding = "DB"
database_name = "cvgen-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Copy the `database_id` value.

### 4. Create R2 Bucket

```bash
npx wrangler r2 bucket create cv-assets
```

**Note**: You may need to enable R2 in your Cloudflare dashboard first.

### 5. Create Vectorize Index

```bash
npx wrangler vectorize create cv-embeddings --dimensions=768 --metric=cosine
```

**Note**: Vectorize may require enabling in your account settings.

### 6. Update wrangler.toml

Edit `wrangler.toml` and update the resource IDs:

```toml
name = "cvgen-worker"
main = "worker/src/index.ts"
compatibility_date = "2024-11-01"
compatibility_flags = ["nodejs_compat"]

[[r2_buckets]]
binding = "CV_ASSETS"
bucket_name = "cv-assets"

[[d1_databases]]
binding = "DB"
database_name = "cvgen-db"
database_id = "YOUR_DATABASE_ID_HERE"  # From step 3

[[vectorize]]
binding = "VECTORIZE"
index_name = "cv-embeddings"

[ai]
binding = "AI"

[browser]
binding = "BROWSER"

[build]
command = "npm run build"
```

### 7. Enable Browser Rendering (Optional)

For PDF generation:

1. Go to your Cloudflare dashboard
2. Navigate to Workers & Pages > Browser Rendering
3. Enable Browser Rendering for your account
4. Update `wrangler.toml` to include browser binding (already configured above)

**Note**: Browser Rendering may have additional costs. If not enabled, PDF generation will return an empty buffer but HTML and Markdown will still work.

### 8. Initialize Database

Run the SQL schema to set up D1 tables:

```bash
npm run worker:init-db
```

Or manually:

```bash
npx wrangler d1 execute cvgen-db --remote --file=./worker/schema.sql
```

### 9. Build the Worker

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 10. Deploy to Cloudflare

```bash
npm run deploy
```

Or:

```bash
npx wrangler deploy
```

**Output**:
```
✨ Built successfully!
✨ Successfully deployed to
   https://cvgen-worker.YOUR_SUBDOMAIN.workers.dev
```

### 11. Configure R2 Public Access (Optional)

To make CV assets publicly accessible:

1. Go to R2 in Cloudflare dashboard
2. Select your `cv-assets` bucket
3. Click "Settings"
4. Under "Public Access", click "Connect Domain"
5. Choose a custom domain or use R2.dev domain
6. Update `StorageService.getPublicUrl()` in `worker/src/services/storage.ts` with your domain

Example:
```typescript
private getPublicUrl(key: string): string {
  return `https://cv-assets.yourdomain.com/${key}`;
}
```

### 12. Test Your Deployment

Visit your worker URL:
```
https://cvgen-worker.YOUR_SUBDOMAIN.workers.dev
```

Test the API:
```bash
curl https://cvgen-worker.YOUR_SUBDOMAIN.workers.dev/health
```

Generate a test CV:
```bash
curl -X POST https://cvgen-worker.YOUR_SUBDOMAIN.workers.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {
      "name": "Test User",
      "position": "Software Engineer",
      "email": "test@example.com",
      "phone": "+1234567890"
    },
    "summary": "This is a test CV generation.",
    "education": [{
      "institution": "Test University",
      "degree": "BS",
      "field_of_study": "Computer Science",
      "end_date": "05/2020"
    }],
    "skills": {
      "programming": ["JavaScript", "TypeScript"]
    }
  }'
```

## Local Development

For local development and testing:

```bash
# Build the worker
npm run build

# Run locally
npm run dev
```

Visit `http://localhost:8787` to test locally.

## Updating Your Deployment

After making changes:

```bash
# Rebuild
npm run build

# Deploy
npm run deploy
```

## Monitoring and Logs

View real-time logs:
```bash
npx wrangler tail
```

View logs in Cloudflare dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Click "Logs" tab

## Custom Domain (Optional)

To use a custom domain:

1. Go to Workers & Pages in Cloudflare
2. Select your worker
3. Click "Triggers" tab
4. Under "Custom Domains", click "Add Custom Domain"
5. Enter your domain and follow DNS setup instructions

## Troubleshooting

### Build Errors

If TypeScript compilation fails:
```bash
# Clean and rebuild
rm -rf dist/
npm run build
```

### Database Not Found

Ensure database is created and initialized:
```bash
npx wrangler d1 list
npm run worker:init-db
```

### R2 Bucket Access Denied

Check bucket exists:
```bash
npx wrangler r2 bucket list
```

Verify bucket name in `wrangler.toml` matches actual bucket name.

### Vectorize Not Available

Vectorize is in beta. Check:
1. Your account has access
2. Index is created: `npx wrangler vectorize list`

### Browser Rendering Errors

If PDF generation fails:
1. Verify Browser Rendering is enabled in your account
2. Check browser binding in `wrangler.toml`
3. Consider using HTML/Markdown only if Browser Rendering isn't available

## Environment Variables

For sensitive configuration (not needed for current setup):

Create `.dev.vars` for local development:
```
# Currently no sensitive variables needed
```

For production secrets:
```bash
npx wrangler secret put SECRET_NAME
```

## Cost Considerations

Cloudflare Workers pricing (as of 2024):

- **Workers**: Free tier includes 100,000 requests/day
- **D1**: Free tier includes 5GB storage, 5M rows read/day
- **R2**: Free tier includes 10GB storage, 10M read requests/month
- **AI**: Usage-based pricing for LLM inference
- **Vectorize**: Beta pricing TBD
- **Browser Rendering**: Pay-as-you-go pricing

Monitor usage in Cloudflare dashboard to stay within free tier.

## Security Notes

Current implementation has no authentication. To add security:

1. Add API key validation
2. Implement rate limiting
3. Add CORS restrictions
4. Use Cloudflare Access for admin pages

## Support

- Documentation: See WORKER_README.md and API_DOCS.md
- Issues: https://github.com/jmbish04/cvgen/issues
- Cloudflare Docs: https://developers.cloudflare.com/workers/

## Next Steps

After deployment:
1. Test all API endpoints
2. Verify CV generation works
3. Test AI chat functionality
4. Configure R2 public domain for asset access
5. Monitor usage and logs
6. Consider adding authentication for production use
