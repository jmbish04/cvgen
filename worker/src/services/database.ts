import { Env, CVData, CVRequestLog } from '../types';

export class DatabaseService {
  constructor(private env: Env) {}

  /**
   * Save a CV generation request to the database
   */
  async saveRequest(
    id: string,
    requestData: CVData,
    htmlUrl: string,
    pdfUrl: string,
    markdownUrl: string
  ): Promise<void> {
    const createdAt = new Date().toISOString();
    
    await this.env.DB.prepare(
      `INSERT INTO cv_requests (id, request_data, html_url, pdf_url, markdown_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
      .bind(
        id,
        JSON.stringify(requestData),
        htmlUrl,
        pdfUrl,
        markdownUrl,
        createdAt
      )
      .run();
  }

  /**
   * Get all CV requests, paginated
   */
  async getRequests(limit = 50, offset = 0): Promise<CVRequestLog[]> {
    const result = await this.env.DB.prepare(
      `SELECT id, request_data, html_url, pdf_url, markdown_url, created_at
       FROM cv_requests
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
      .bind(limit, offset)
      .all();

    return result.results.map((row: any) => ({
      id: row.id,
      request_data: JSON.parse(row.request_data),
      html_url: row.html_url,
      pdf_url: row.pdf_url,
      markdown_url: row.markdown_url,
      created_at: row.created_at,
    }));
  }

  /**
   * Get a specific CV request by ID
   */
  async getRequestById(id: string): Promise<CVRequestLog | null> {
    const result = await this.env.DB.prepare(
      `SELECT id, request_data, html_url, pdf_url, markdown_url, created_at
       FROM cv_requests
       WHERE id = ?`
    )
      .bind(id)
      .first();

    if (!result) return null;

    return {
      id: result.id as string,
      request_data: JSON.parse(result.request_data as string),
      html_url: result.html_url as string,
      pdf_url: result.pdf_url as string,
      markdown_url: result.markdown_url as string,
      created_at: result.created_at as string,
    };
  }

  /**
   * Save vector metadata for a CV
   */
  async saveVectorMetadata(
    cvRequestId: string,
    contentChunk: string,
    vectorId: string
  ): Promise<void> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    
    await this.env.DB.prepare(
      `INSERT INTO cv_vectors (id, cv_request_id, content_chunk, vector_id, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
      .bind(id, cvRequestId, contentChunk, vectorId, createdAt)
      .run();
  }

  /**
   * Search CV content (for context retrieval)
   */
  async searchCVContent(query: string, limit = 10): Promise<any[]> {
    // This would use full-text search if available in D1
    const result = await this.env.DB.prepare(
      `SELECT DISTINCT cr.id, cr.request_data, cr.html_url, cr.pdf_url, cr.markdown_url, cr.created_at
       FROM cv_requests cr
       JOIN cv_vectors cv ON cr.id = cv.cv_request_id
       WHERE cv.content_chunk LIKE ?
       ORDER BY cr.created_at DESC
       LIMIT ?`
    )
      .bind(`%${query}%`, limit)
      .all();

    return result.results.map((row: any) => ({
      id: row.id,
      request_data: JSON.parse(row.request_data),
      html_url: row.html_url,
      pdf_url: row.pdf_url,
      markdown_url: row.markdown_url,
      created_at: row.created_at,
    }));
  }
}
