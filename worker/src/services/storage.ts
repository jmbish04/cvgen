import { Env } from '../types';

export class StorageService {
  constructor(private env: Env) {}

  /**
   * Store HTML content in R2
   */
  async storeHTML(id: string, htmlContent: string): Promise<string> {
    const key = `cv/${id}/resume.html`;
    
    await this.env.CV_ASSETS.put(key, htmlContent, {
      httpMetadata: {
        contentType: 'text/html',
      },
    });

    return this.getPublicUrl(key);
  }

  /**
   * Store PDF content in R2
   */
  async storePDF(id: string, pdfBuffer: ArrayBuffer): Promise<string> {
    const key = `cv/${id}/resume.pdf`;
    
    await this.env.CV_ASSETS.put(key, pdfBuffer, {
      httpMetadata: {
        contentType: 'application/pdf',
      },
    });

    return this.getPublicUrl(key);
  }

  /**
   * Store Markdown content in R2
   */
  async storeMarkdown(id: string, markdownContent: string): Promise<string> {
    const key = `cv/${id}/resume.md`;
    
    await this.env.CV_ASSETS.put(key, markdownContent, {
      httpMetadata: {
        contentType: 'text/markdown',
      },
    });

    return this.getPublicUrl(key);
  }

  /**
   * Get public URL for an R2 object
   */
  private getPublicUrl(key: string): string {
    // In production, this should use your R2 custom domain or public bucket URL
    // For now, we'll use a placeholder format
    return `https://cv-assets.yourdomain.com/${key}`;
  }

  /**
   * Retrieve content from R2
   */
  async getObject(key: string): Promise<R2ObjectBody | null> {
    return await this.env.CV_ASSETS.get(key);
  }

  /**
   * Delete CV assets
   */
  async deleteCVAssets(id: string): Promise<void> {
    const keys = [
      `cv/${id}/resume.html`,
      `cv/${id}/resume.pdf`,
      `cv/${id}/resume.md`,
    ];

    await Promise.all(
      keys.map(key => this.env.CV_ASSETS.delete(key))
    );
  }
}
