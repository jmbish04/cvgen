// Types for Cloudflare Worker bindings
export interface Env {
  CV_ASSETS: R2Bucket;
  DB: D1Database;
  VECTORIZE: VectorizeIndex;
  AI: any;
  BROWSER: any;
}

// CV Data Types
export interface CVProfile {
  name: string;
  position: string;
  seniority_level?: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  website?: string;
}

export interface CVExperience {
  company: string;
  position: string;
  location: string;
  start_date: string;
  end_date?: string | null;
  description: string;
  achievements: string[];
}

export interface CVEducation {
  institution: string;
  degree: string;
  field_of_study: string;
  end_date: string;
  gpa?: string;
}

export interface CVProject {
  name: string;
  description: string;
  technologies: string[];
  github_url?: string;
  live_url?: string;
}

export interface CVCertification {
  name: string;
  issuer: string;
  date: string;
  expiry_date?: string | null;
}

export interface CVLanguage {
  language: string;
  proficiency: 'Native' | 'Fluent' | 'Intermediate' | 'Basic';
}

export interface CVData {
  profile: CVProfile;
  summary: string;
  experiences?: CVExperience[];
  education: CVEducation[];
  skills: Record<string, string[]>;
  projects?: CVProject[];
  certifications?: CVCertification[];
  languages?: CVLanguage[];
}

// API Response Types
export interface CVGenerationResult {
  id: string;
  html_url: string;
  pdf_url: string;
  markdown_url: string;
  created_at: string;
}

export interface CVRequestLog {
  id: string;
  request_data: CVData;
  html_url: string;
  pdf_url: string;
  markdown_url: string;
  created_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  sources?: CVRequestLog[];
}
