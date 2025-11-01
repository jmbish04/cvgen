import { Env, CVData } from '../types';
import Handlebars from 'handlebars';
import TurndownService from 'turndown';

export class CVGeneratorService {
  private template: HandlebarsTemplateDelegate | null = null;

  constructor(private env: Env) {
    // Register Handlebars helpers
    Handlebars.registerHelper('join', function(array) {
      if (!array || !Array.isArray(array)) return '';
      return array.join(', ');
    });
  }

  /**
   * Load the CV template
   */
  async loadTemplate(): Promise<void> {
    // In production, load from R2 or embed in worker
    // For now, we'll use a simplified inline template
    const templateContent = this.getDefaultTemplate();
    this.template = Handlebars.compile(templateContent);
  }

  /**
   * Generate HTML from CV data
   */
  async generateHTML(cvData: CVData): Promise<string> {
    if (!this.template) {
      await this.loadTemplate();
    }

    return this.template!(cvData);
  }

  /**
   * Generate PDF from HTML using Cloudflare Browser Rendering
   */
  async generatePDF(htmlContent: string): Promise<ArrayBuffer> {
    try {
      // Use Cloudflare Browser Rendering API
      const browser = await this.env.BROWSER.launch();
      const page = await browser.newPage();
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '0mm',
          right: '0mm',
          bottom: '0mm',
          left: '0mm',
        },
        printBackground: true,
      });
      
      await browser.close();
      
      return pdfBuffer;
    } catch (error) {
      console.error('PDF generation error:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  /**
   * Convert HTML to Markdown
   */
  htmlToMarkdown(htmlContent: string): string {
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    return turndownService.turndown(htmlContent);
  }

  /**
   * Get default CV template
   */
  private getDefaultTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{profile.name}} - {{profile.position}}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        .header {
            border-bottom: 3px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 5px;
        }
        .position {
            color: #7f8c8d;
            font-size: 1.2em;
            margin-bottom: 15px;
        }
        .contact-info {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            color: #555;
            font-size: 0.9em;
        }
        .contact-info a {
            color: #3498db;
            text-decoration: none;
        }
        .section {
            margin-bottom: 30px;
        }
        h2 {
            color: #2c3e50;
            font-size: 1.5em;
            border-bottom: 2px solid #ecf0f1;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        .summary {
            color: #555;
            font-size: 1em;
            line-height: 1.8;
        }
        .experience-item, .education-item, .project-item {
            margin-bottom: 20px;
        }
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        .item-title {
            font-weight: 600;
            color: #2c3e50;
            font-size: 1.1em;
        }
        .item-subtitle {
            color: #7f8c8d;
            font-size: 0.95em;
        }
        .item-date {
            color: #95a5a6;
            font-size: 0.9em;
            white-space: nowrap;
        }
        .item-description {
            color: #555;
            margin-bottom: 8px;
        }
        .achievements {
            list-style-position: inside;
            color: #555;
        }
        .achievements li {
            margin-bottom: 5px;
        }
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .skill-category {
            flex: 1 1 45%;
            min-width: 200px;
        }
        .skill-category-name {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 5px;
            text-transform: capitalize;
        }
        .skill-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .skill-tag {
            background: #ecf0f1;
            color: #2c3e50;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85em;
        }
        @media print {
            body {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{profile.name}}</h1>
        <div class="position">{{profile.position}}</div>
        <div class="contact-info">
            {{#if profile.email}}<span>✉️ {{profile.email}}</span>{{/if}}
            {{#if profile.phone}}<span>📱 {{profile.phone}}</span>{{/if}}
            {{#if profile.location}}<span>📍 {{profile.location}}</span>{{/if}}
            {{#if profile.linkedin}}<span><a href="{{profile.linkedin}}">🔗 LinkedIn</a></span>{{/if}}
            {{#if profile.github}}<span><a href="{{profile.github}}">💻 GitHub</a></span>{{/if}}
            {{#if profile.website}}<span><a href="{{profile.website}}">🌐 Website</a></span>{{/if}}
        </div>
    </div>

    {{#if summary}}
    <div class="section">
        <h2>Professional Summary</h2>
        <p class="summary">{{summary}}</p>
    </div>
    {{/if}}

    {{#if experiences}}
    <div class="section">
        <h2>Experience</h2>
        {{#each experiences}}
        <div class="experience-item">
            <div class="item-header">
                <div>
                    <div class="item-title">{{position}}</div>
                    <div class="item-subtitle">{{company}} • {{location}}</div>
                </div>
                <div class="item-date">{{start_date}} - {{#if end_date}}{{end_date}}{{else}}Present{{/if}}</div>
            </div>
            {{#if description}}
            <p class="item-description">{{description}}</p>
            {{/if}}
            {{#if achievements}}
            <ul class="achievements">
                {{#each achievements}}
                <li>{{this}}</li>
                {{/each}}
            </ul>
            {{/if}}
        </div>
        {{/each}}
    </div>
    {{/if}}

    {{#if education}}
    <div class="section">
        <h2>Education</h2>
        {{#each education}}
        <div class="education-item">
            <div class="item-header">
                <div>
                    <div class="item-title">{{degree}} in {{field_of_study}}</div>
                    <div class="item-subtitle">{{institution}}</div>
                </div>
                <div class="item-date">{{end_date}}</div>
            </div>
            {{#if gpa}}
            <p class="item-description">GPA: {{gpa}}</p>
            {{/if}}
        </div>
        {{/each}}
    </div>
    {{/if}}

    {{#if skills}}
    <div class="section">
        <h2>Skills</h2>
        <div class="skills">
            {{#each skills}}
            <div class="skill-category">
                <div class="skill-category-name">{{@key}}</div>
                <div class="skill-tags">
                    {{#each this}}
                    <span class="skill-tag">{{this}}</span>
                    {{/each}}
                </div>
            </div>
            {{/each}}
        </div>
    </div>
    {{/if}}

    {{#if projects}}
    <div class="section">
        <h2>Projects</h2>
        {{#each projects}}
        <div class="project-item">
            <div class="item-title">{{name}}</div>
            <p class="item-description">{{description}}</p>
            <div class="skill-tags">
                {{#each technologies}}
                <span class="skill-tag">{{this}}</span>
                {{/each}}
            </div>
            {{#if github_url}}
            <p><a href="{{github_url}}">View on GitHub</a></p>
            {{/if}}
        </div>
        {{/each}}
    </div>
    {{/if}}

    {{#if certifications}}
    <div class="section">
        <h2>Certifications</h2>
        {{#each certifications}}
        <div class="experience-item">
            <div class="item-header">
                <div>
                    <div class="item-title">{{name}}</div>
                    <div class="item-subtitle">{{issuer}}</div>
                </div>
                <div class="item-date">{{date}}</div>
            </div>
        </div>
        {{/each}}
    </div>
    {{/if}}

    {{#if languages}}
    <div class="section">
        <h2>Languages</h2>
        <div class="skill-tags">
            {{#each languages}}
            <span class="skill-tag">{{language}} ({{proficiency}})</span>
            {{/each}}
        </div>
    </div>
    {{/if}}
</body>
</html>`;
  }
}
