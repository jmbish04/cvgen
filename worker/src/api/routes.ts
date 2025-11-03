import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env, CVGenerationResult } from '../types';
import { CVDataSchema, ChatRequestSchema } from '../schema/cv-schema';
import { CVGeneratorService } from '../services/cv-generator';
import { StorageService } from '../services/storage';
import { DatabaseService } from '../services/database';
import { VectorizeService } from '../services/vectorize';
import { AIAgentService } from '../services/ai-agent';

// Response schemas
const CVGenerationResultSchema = z.object({
  id: z.string(),
  html_url: z.string(),
  pdf_url: z.string(),
  markdown_url: z.string(),
  created_at: z.string(),
});

const CVRequestLogSchema = z.object({
  id: z.string(),
  request_data: CVDataSchema,
  html_url: z.string(),
  pdf_url: z.string(),
  markdown_url: z.string(),
  created_at: z.string(),
});

const ChatResponseSchema = z.object({
  message: z.string(),
  sources: z.array(CVRequestLogSchema).optional(),
});

export function createAPIRoutes(app: OpenAPIHono<{ Bindings: Env }>) {
  // Generate CV endpoint
  const generateRoute = createRoute({
    method: 'post',
    path: '/api/generate',
    tags: ['CV Generation'],
    summary: 'Generate a CV',
    description: 'Generate a CV in HTML, PDF, and Markdown formats from JSON data',
    request: {
      body: {
        content: {
          'application/json': {
            schema: CVDataSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'CV generated successfully',
        content: {
          'application/json': {
            schema: CVGenerationResultSchema,
          },
        },
      },
      400: {
        description: 'Invalid request data',
      },
      500: {
        description: 'Internal server error',
      },
    },
  });

  app.openapi(generateRoute, async (c) => {
    try {
      const cvData = c.req.valid('json');
      const id = crypto.randomUUID();

      // Initialize services
      const cvGenerator = new CVGeneratorService(c.env);
      const storage = new StorageService(c.env);
      const database = new DatabaseService(c.env);
      const vectorize = new VectorizeService(c.env);

      // Generate HTML
      const htmlContent = await cvGenerator.generateHTML(cvData);

      // Generate PDF
      let pdfBuffer: ArrayBuffer;
      try {
        pdfBuffer = await cvGenerator.generatePDF(htmlContent);
      } catch (error) {
        console.error('PDF generation failed:', error);
        // Create empty buffer as fallback
        pdfBuffer = new ArrayBuffer(0);
      }

      // Generate Markdown
      const markdownContent = cvGenerator.htmlToMarkdown(htmlContent);

      // Store all formats in R2
      const [htmlUrl, pdfUrl, markdownUrl] = await Promise.all([
        storage.storeHTML(id, htmlContent),
        storage.storePDF(id, pdfBuffer),
        storage.storeMarkdown(id, markdownContent),
      ]);

      // Save to database
      await database.saveRequest(id, cvData, htmlUrl, pdfUrl, markdownUrl);

      // Index in Vectorize for search
      await vectorize.indexCV(id, cvData);

      const result: CVGenerationResult = {
        id,
        html_url: htmlUrl,
        pdf_url: pdfUrl,
        markdown_url: markdownUrl,
        created_at: new Date().toISOString(),
      };

      return c.json(result, 200);
    } catch (error: any) {
      console.error('Error generating CV:', error);
      return c.json({ error: error.message || 'Failed to generate CV' }, 500);
    }
  });

  // List CVs endpoint
  const listRoute = createRoute({
    method: 'get',
    path: '/api/cvs',
    tags: ['CV Management'],
    summary: 'List all CVs',
    description: 'Get a paginated list of all generated CVs',
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).optional().default(50),
        offset: z.coerce.number().int().min(0).optional().default(0),
      }),
    },
    responses: {
      200: {
        description: 'List of CVs',
        content: {
          'application/json': {
            schema: z.object({
              cvs: z.array(CVRequestLogSchema),
              total: z.number(),
              limit: z.number(),
              offset: z.number(),
            }),
          },
        },
      },
    },
  });

  app.openapi(listRoute, async (c) => {
    const { limit: limitStr, offset: offsetStr } = c.req.valid('query');
    const limit = parseInt(limitStr, 10);
    const offset = parseInt(offsetStr, 10);

    const database = new DatabaseService(c.env);
    const cvs = await database.getRequests(limit, offset);

    return c.json({
      cvs,
      total: cvs.length,
      limit,
      offset,
    });
  });

  // Get specific CV endpoint
  const getRoute = createRoute({
    method: 'get',
    path: '/api/cvs/{id}',
    tags: ['CV Management'],
    summary: 'Get a specific CV',
    description: 'Retrieve details of a specific CV by ID',
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'CV details',
        content: {
          'application/json': {
            schema: CVRequestLogSchema,
          },
        },
      },
      404: {
        description: 'CV not found',
      },
    },
  });

  app.openapi(getRoute, async (c) => {
    const { id } = c.req.valid('param');
    const database = new DatabaseService(c.env);
    const cv = await database.getRequestById(id);

    if (!cv) {
      return c.json({ error: 'CV not found' }, 404);
    }

    return c.json(cv);
  });

  // Chat with AI agent endpoint
  const chatRoute = createRoute({
    method: 'post',
    path: '/api/chat',
    tags: ['AI Agent'],
    summary: 'Chat with AI agent',
    description: 'Ask questions about your CVs and get AI-powered insights',
    request: {
      body: {
        content: {
          'application/json': {
            schema: ChatRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Chat response',
        content: {
          'application/json': {
            schema: ChatResponseSchema,
          },
        },
      },
      400: {
        description: 'Invalid request',
      },
    },
  });

  app.openapi(chatRoute, async (c) => {
    const { message, conversation_history } = c.req.valid('json');
    
    const aiAgent = new AIAgentService(c.env);
    const response = await aiAgent.chat(message, conversation_history || []);

    return c.json(response);
  });

  // Search CVs endpoint
  const searchRoute = createRoute({
    method: 'get',
    path: '/api/search',
    tags: ['Search'],
    summary: 'Search CVs',
    description: 'Search through CV content using semantic search',
    request: {
      query: z.object({
        q: z.string().min(1),
        limit: z.string().optional().default('10'),
      }),
    },
    responses: {
      200: {
        description: 'Search results',
        content: {
          'application/json': {
            schema: z.object({
              results: z.array(z.any()),
            }),
          },
        },
      },
    },
  });

  app.openapi(searchRoute, async (c) => {
    const { q, limit: limitStr } = c.req.valid('query');
    const limit = parseInt(limitStr, 10);

    const vectorize = new VectorizeService(c.env);
    const results = await vectorize.searchSimilar(q, limit);

    return c.json({ results });
  });

  return app;
}
