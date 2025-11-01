import { z } from 'zod';

// CV Profile Schema
export const CVProfileSchema = z.object({
  name: z.string().min(1),
  position: z.string().min(1),
  seniority_level: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(5),
  location: z.string().optional(),
  linkedin: z.string().url().optional(),
  github: z.string().url().optional(),
  website: z.string().url().optional(),
});

// CV Experience Schema
export const CVExperienceSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  location: z.string().min(1),
  start_date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|(0[1-9]|1[0-2])\/(19|20)\d{2})$/),
  end_date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|(0[1-9]|1[0-2])\/(19|20)\d{2}|[Pp][Rr][Ee][Ss][Ee][Nn][Tt])$/).nullable().optional(),
  description: z.string().min(1),
  achievements: z.array(z.string().min(1)).min(1),
});

// CV Education Schema
export const CVEducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field_of_study: z.string().min(1),
  end_date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|(0[1-9]|1[0-2])\/(19|20)\d{2})$/),
  gpa: z.string().optional(),
});

// CV Project Schema
export const CVProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)).min(1),
  github_url: z.string().url().optional(),
  live_url: z.string().url().optional(),
});

// CV Certification Schema
export const CVCertificationSchema = z.object({
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|(0[1-9]|1[0-2])\/(19|20)\d{2})$/),
  expiry_date: z.string().regex(/^(\d{4}-\d{2}-\d{2}|(0[1-9]|1[0-2])\/(19|20)\d{2})$/).nullable().optional(),
});

// CV Language Schema
export const CVLanguageSchema = z.object({
  language: z.string().min(1),
  proficiency: z.enum(['Native', 'Fluent', 'Intermediate', 'Basic']),
});

// Main CV Data Schema
export const CVDataSchema = z.object({
  profile: CVProfileSchema,
  summary: z.string().min(10),
  experiences: z.array(CVExperienceSchema).optional(),
  education: z.array(CVEducationSchema).min(1),
  skills: z.record(z.string(), z.array(z.string().min(1))),
  projects: z.array(CVProjectSchema).optional(),
  certifications: z.array(CVCertificationSchema).optional(),
  languages: z.array(CVLanguageSchema).optional(),
});

// Chat Request Schema
export const ChatRequestSchema = z.object({
  message: z.string().min(1),
  conversation_history: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).optional(),
});

export type CVDataType = z.infer<typeof CVDataSchema>;
export type ChatRequestType = z.infer<typeof ChatRequestSchema>;
