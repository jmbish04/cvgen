import { OpenAPIHono } from '@hono/zod-openapi';
import { Env } from '../types';
import YAML from 'yaml';

export function setupOpenAPIRoutes(app: OpenAPIHono<{ Bindings: Env }>) {
  // Serve OpenAPI JSON
  const getSpec = () => app.getOpenAPIDocument({
    openapi: '3.1.0',
    info: {
      title: 'CVGen API',
      version: '1.0.0',
      description: 'Professional CV/Resume Generator API with AI-powered insights',
      contact: {
        name: 'CVGen Support',
        url: 'https://github.com/jmbish04/cvgen',
      },
    },
    servers: [
      {
        url: 'https://cvgen.your-domain.workers.dev',
        description: 'Production server',
      },
      {
        url: 'http://localhost:8787',
        description: 'Local development server',
      },
    ],
    tags: [
      {
        name: 'CV Generation',
        description: 'Endpoints for generating CVs/resumes',
      },
      {
        name: 'CV Management',
        description: 'Endpoints for managing and retrieving CVs',
      },
      {
        name: 'AI Agent',
        description: 'AI-powered career advice and CV insights',
      },
      {
        name: 'Search',
        description: 'Search through CV content',
      },
    ],
  });

  // Serve OpenAPI JSON
  app.get('/openapi.json', (c) => {
    return c.json(getSpec());
  });

  // Serve OpenAPI YAML
  app.get('/openapi.yaml', (c) => {
    const spec = getSpec();
    const yamlContent = YAML.stringify(spec);
    return c.text(yamlContent, 200, {
      'Content-Type': 'application/x-yaml',
    });
  });

  return app;
}
