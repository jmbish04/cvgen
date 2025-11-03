# CVGen API Documentation

## Overview

CVGen provides a comprehensive RESTful API for generating professional CVs/resumes with AI-powered insights.

**Base URL**: `https://your-worker.workers.dev`

**No Authentication Required**: All endpoints are publicly accessible.

## Endpoints

### 1. Generate CV

Generate a CV in HTML, PDF, and Markdown formats.

**Endpoint**: `POST /api/generate`

**Request Body**:
```json
{
  "profile": {
    "name": "John Doe",
    "position": "Software Engineer",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "San Francisco, CA",
    "linkedin": "https://linkedin.com/in/johndoe",
    "github": "https://github.com/johndoe"
  },
  "summary": "Experienced software engineer with 5+ years...",
  "experiences": [
    {
      "company": "Tech Corp",
      "position": "Senior Developer",
      "location": "San Francisco, CA",
      "start_date": "01/2020",
      "end_date": "Present",
      "description": "Leading development...",
      "achievements": [
        "Built scalable microservices",
        "Reduced latency by 40%"
      ]
    }
  ],
  "education": [
    {
      "institution": "University of California",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      "end_date": "05/2018",
      "gpa": "3.8"
    }
  ],
  "skills": {
    "programming_languages": ["JavaScript", "Python"],
    "frameworks": ["React", "Node.js"]
  }
}
```

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "html_url": "https://cv-assets.yourdomain.com/cv/.../resume.html",
  "pdf_url": "https://cv-assets.yourdomain.com/cv/.../resume.pdf",
  "markdown_url": "https://cv-assets.yourdomain.com/cv/.../resume.md",
  "created_at": "2024-11-01T12:00:00.000Z"
}
```

### 2. List CVs

Get a paginated list of all generated CVs.

**Endpoint**: `GET /api/cvs`

**Query Parameters**:
- `limit` (optional): Number of results per page (default: 50, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Example**: `GET /api/cvs?limit=10&offset=0`

**Response**:
```json
{
  "cvs": [
    {
      "id": "uuid",
      "request_data": { ... },
      "html_url": "...",
      "pdf_url": "...",
      "markdown_url": "...",
      "created_at": "2024-11-01T12:00:00.000Z"
    }
  ],
  "total": 10,
  "limit": 10,
  "offset": 0
}
```

### 3. Get Specific CV

Retrieve details of a specific CV by ID.

**Endpoint**: `GET /api/cvs/{id}`

**Example**: `GET /api/cvs/550e8400-e29b-41d4-a716-446655440000`

**Response**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "request_data": {
    "profile": { ... },
    "summary": "...",
    ...
  },
  "html_url": "...",
  "pdf_url": "...",
  "markdown_url": "...",
  "created_at": "2024-11-01T12:00:00.000Z"
}
```

### 4. Chat with AI Agent

Ask questions about your CVs and get AI-powered career advice.

**Endpoint**: `POST /api/chat`

**Request Body**:
```json
{
  "message": "What skills have I used most in my CVs?",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous message..."
    },
    {
      "role": "assistant",
      "content": "Previous response..."
    }
  ]
}
```

**Response**:
```json
{
  "message": "Based on your CV history, you've primarily used JavaScript, Python, and React...",
  "sources": [
    {
      "id": "uuid",
      "request_data": { ... },
      "created_at": "..."
    }
  ]
}
```

### 5. Search CVs

Perform semantic search through CV content using vector embeddings.

**Endpoint**: `GET /api/search`

**Query Parameters**:
- `q` (required): Search query
- `limit` (optional): Number of results (default: 10)

**Example**: `GET /api/search?q=javascript experience&limit=5`

**Response**:
```json
{
  "results": [
    {
      "score": 0.89,
      "cv_request_id": "uuid",
      "content": "Experience with JavaScript...",
      "type": "experience"
    }
  ]
}
```

### 6. Health Check

Check the health status of the API.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-11-01T12:00:00.000Z",
  "version": "1.0.0"
}
```

## OpenAPI Documentation

Auto-generated OpenAPI documentation is available at:

- **JSON**: `GET /openapi.json`
- **YAML**: `GET /openapi.yaml`

Import these into tools like Swagger UI or Postman for interactive API exploration.

## Frontend Pages

In addition to the API, the worker serves frontend pages:

- **Editor**: `/` - Create and preview CVs
- **History**: `/history` - View all generated CVs
- **Chat**: `/chat` - AI assistant interface

## Data Schema

### CV Profile
```typescript
{
  name: string;
  position: string;
  seniority_level?: string;
  email: string; // Valid email format
  phone: string; // Min 5 characters
  location?: string;
  linkedin?: string; // Valid URL
  github?: string; // Valid URL
  website?: string; // Valid URL
}
```

### Experience
```typescript
{
  company: string;
  position: string;
  location: string;
  start_date: string; // Format: MM/YYYY or YYYY-MM-DD
  end_date?: string | null; // Format: MM/YYYY or YYYY-MM-DD or "Present"
  description: string;
  achievements: string[]; // Min 1 achievement
}
```

### Education
```typescript
{
  institution: string;
  degree: string;
  field_of_study: string;
  end_date: string; // Format: MM/YYYY or YYYY-MM-DD
  gpa?: string;
}
```

### Skills
```typescript
{
  [category: string]: string[]; // e.g., "programming_languages": ["JavaScript"]
}
```

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid data)
- `404`: Not Found
- `500`: Internal Server Error

## Rate Limiting

No rate limiting is currently enforced. The API is suitable for personal use and small-scale applications.

## Examples

### cURL

**Generate CV**:
```bash
curl -X POST https://your-worker.workers.dev/api/generate \
  -H "Content-Type: application/json" \
  -d @cv-data.json
```

**List CVs**:
```bash
curl https://your-worker.workers.dev/api/cvs?limit=10
```

**Chat**:
```bash
curl -X POST https://your-worker.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are my top skills?"}'
```

### JavaScript (Fetch)

```javascript
// Generate CV
const response = await fetch('https://your-worker.workers.dev/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(cvData)
});
const result = await response.json();
console.log('CV URLs:', result);

// Chat with AI
const chatResponse = await fetch('https://your-worker.workers.dev/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What skills should I highlight?'
  })
});
const chatData = await chatResponse.json();
console.log('AI Response:', chatData.message);
```

### Python

```python
import requests
import json

# Generate CV
cv_data = {
    "profile": {...},
    "summary": "...",
    ...
}

response = requests.post(
    'https://your-worker.workers.dev/api/generate',
    json=cv_data
)
result = response.json()
print(f"HTML URL: {result['html_url']}")
print(f"PDF URL: {result['pdf_url']}")

# Chat with AI
chat_response = requests.post(
    'https://your-worker.workers.dev/api/chat',
    json={'message': 'What are my top skills?'}
)
chat_data = chat_response.json()
print(f"AI: {chat_data['message']}")
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/jmbish04/cvgen/issues
- Documentation: See WORKER_README.md
