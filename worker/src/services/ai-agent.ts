import { Env, ChatMessage } from '../types';
import { VectorizeService } from './vectorize';
import { DatabaseService } from './database';

export class AIAgentService {
  private vectorizeService: VectorizeService;
  private dbService: DatabaseService;

  constructor(private env: Env) {
    this.vectorizeService = new VectorizeService(env);
    this.dbService = new DatabaseService(env);
  }

  /**
   * Process a chat message with RAG (Retrieval Augmented Generation)
   */
  async chat(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<{ message: string; sources: any[] }> {
    // Search for relevant CV content using vector similarity
    const relevantContent = await this.vectorizeService.searchSimilar(message, 5);

    // Get full CV request details for the relevant content
    const sources = await Promise.all(
      relevantContent
        .map(content => content.cv_request_id)
        .filter((id, index, self) => self.indexOf(id) === index) // unique IDs
        .slice(0, 3) // limit to 3 sources
        .map(id => this.dbService.getRequestById(id))
    );

    const validSources = sources.filter(s => s !== null);

    // Build context from relevant CVs
    const context = this.buildContext(relevantContent, validSources);

    // Create system prompt
    const systemPrompt = `You are an expert career advisor and resume consultant. You have access to a database of resumes and CVs that the user has created over time. Your role is to:

1. Help users understand their career history and progression
2. Provide insights and recommendations for improving their resumes
3. Suggest content based on previous successful resumes
4. Answer questions about their skills, experiences, and qualifications
5. Help maintain consistency across different resume versions

Use the following context from the user's previous resumes to inform your responses:

${context}

Be helpful, professional, and provide specific, actionable advice when possible.`;

    // Build messages for AI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // Call Cloudflare AI
    const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      max_tokens: 1000,
      temperature: 0.7,
    });

    return {
      message: response.response || 'I apologize, but I was unable to generate a response.',
      sources: validSources,
    };
  }

  /**
   * Build context string from relevant CV content
   */
  private buildContext(relevantContent: any[], sources: any[]): string {
    let context = 'Previous Resume Data:\n\n';

    sources.forEach((source, index) => {
      if (!source) return;
      
      const cvData = source.request_data;
      context += `Resume ${index + 1} (Created: ${source.created_at}):\n`;
      context += `- Name: ${cvData.profile.name}\n`;
      context += `- Position: ${cvData.profile.position}\n`;
      context += `- Summary: ${cvData.summary}\n`;
      
      if (cvData.experiences && cvData.experiences.length > 0) {
        context += `- Recent Experience: ${cvData.experiences[0].position} at ${cvData.experiences[0].company}\n`;
      }
      
      if (cvData.skills) {
        const skillCategories = Object.keys(cvData.skills).slice(0, 3);
        context += `- Key Skill Areas: ${skillCategories.join(', ')}\n`;
      }
      
      context += '\n';
    });

    // Add relevant chunks
    if (relevantContent.length > 0) {
      context += '\nMost Relevant Content:\n';
      relevantContent.slice(0, 3).forEach((content, index) => {
        context += `${index + 1}. ${content.content}\n`;
      });
    }

    return context;
  }

  /**
   * Get suggestions for improving a CV
   */
  async getSuggestions(cvData: any): Promise<string[]> {
    // Search for similar CVs
    const queryText = `${cvData.profile.position} with experience in ${Object.keys(cvData.skills).join(', ')}`;
    const similarCVs = await this.vectorizeService.searchSimilar(queryText, 3);

    const prompt = `Based on this CV profile, provide 3-5 specific suggestions for improvement:

Position: ${cvData.profile.position}
Skills: ${Object.keys(cvData.skills).join(', ')}
Experience Count: ${cvData.experiences?.length || 0}

Provide suggestions in a numbered list format.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'You are a professional resume consultant.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 500,
    });

    // Parse suggestions from response
    const suggestions = (response.response || '')
      .split('\n')
      .filter((line: string) => line.match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((s: string) => s.length > 0);

    return suggestions;
  }
}
