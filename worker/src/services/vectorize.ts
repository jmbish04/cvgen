import { Env, CVData } from '../types';
import { DatabaseService } from './database';

export class VectorizeService {
  private dbService: DatabaseService;

  constructor(private env: Env) {
    this.dbService = new DatabaseService(env);
  }

  /**
   * Generate embeddings for CV content and store in Vectorize
   */
  async indexCV(cvRequestId: string, cvData: CVData): Promise<void> {
    // Create searchable content chunks from CV data
    const contentChunks = this.createContentChunks(cvData);

    for (const chunk of contentChunks) {
      // Generate embedding using Cloudflare AI
      const embeddings = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
        text: chunk.content,
      });

      // Store in Vectorize
      const vectorId = crypto.randomUUID();
      await this.env.VECTORIZE.upsert([
        {
          id: vectorId,
          values: embeddings.data[0],
          metadata: {
            cv_request_id: cvRequestId,
            content: chunk.content,
            type: chunk.type,
          },
        },
      ]);

      // Save vector metadata to D1
      await this.dbService.saveVectorMetadata(cvRequestId, chunk.content, vectorId);
    }
  }

  /**
   * Search for similar CV content using vector similarity
   */
  async searchSimilar(query: string, limit = 5): Promise<any[]> {
    // Generate embedding for query
    const queryEmbedding = await this.env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: query,
    });

    // Search in Vectorize
    const results = await this.env.VECTORIZE.query(queryEmbedding.data[0], {
      topK: limit,
      returnMetadata: true,
    });

    return results.matches.map((match: any) => ({
      score: match.score,
      cv_request_id: match.metadata?.cv_request_id,
      content: match.metadata?.content,
      type: match.metadata?.type,
    }));
  }

  /**
   * Create content chunks from CV data for indexing
   */
  private createContentChunks(cvData: CVData): Array<{ content: string; type: string }> {
    const chunks: Array<{ content: string; type: string }> = [];

    // Profile chunk
    chunks.push({
      content: `${cvData.profile.name} - ${cvData.profile.position}. Contact: ${cvData.profile.email}. ${cvData.profile.location || ''}`,
      type: 'profile',
    });

    // Summary chunk
    chunks.push({
      content: `Professional Summary: ${cvData.summary}`,
      type: 'summary',
    });

    // Experience chunks
    if (cvData.experiences) {
      cvData.experiences.forEach((exp, index) => {
        const content = `
          Experience ${index + 1}: ${exp.position} at ${exp.company} (${exp.location})
          Duration: ${exp.start_date} - ${exp.end_date || 'Present'}
          Description: ${exp.description}
          Achievements: ${exp.achievements.join('. ')}
        `.trim();
        chunks.push({ content, type: 'experience' });
      });
    }

    // Education chunks
    cvData.education.forEach((edu, index) => {
      const content = `
        Education ${index + 1}: ${edu.degree} in ${edu.field_of_study}
        Institution: ${edu.institution}
        Completed: ${edu.end_date}
        ${edu.gpa ? `GPA: ${edu.gpa}` : ''}
      `.trim();
      chunks.push({ content, type: 'education' });
    });

    // Skills chunk
    const skillsList = Object.entries(cvData.skills)
      .map(([category, skills]) => `${category}: ${skills.join(', ')}`)
      .join('. ');
    chunks.push({
      content: `Skills: ${skillsList}`,
      type: 'skills',
    });

    // Projects chunks
    if (cvData.projects) {
      cvData.projects.forEach((proj, index) => {
        const content = `
          Project ${index + 1}: ${proj.name}
          Description: ${proj.description}
          Technologies: ${proj.technologies.join(', ')}
        `.trim();
        chunks.push({ content, type: 'project' });
      });
    }

    return chunks;
  }
}
