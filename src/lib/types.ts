import { z } from "zod";

export const ComplexityLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type ComplexityLevel = z.infer<typeof ComplexityLevelSchema>;

export const AnalysisStatusSchema = z.enum(["pending", "processing", "complete", "error"]);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const AIProviderSchema = z.enum(["anthropic", "openai", "google", "groq"]);
export type AIProvider = z.infer<typeof AIProviderSchema>;

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: string[];
  html_url: string;
  comments: number;
  created_at: string;
  user: string | null;
}

export interface AnalyzedIssue extends GitHubIssue {
  complexity: ComplexityLevel;
  reasoning: string;
  technologies?: string[];
  estimatedHours?: number;
}

export interface AnalysisResult {
  id: string;
  repoUrl: string;
  owner: string;
  repo: string;
  status: AnalysisStatus;
  progress: {
    current: number;
    total: number;
  };
  issues: AnalyzedIssue[];
  provider?: AIProvider;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ComplexityAnalysisSchema = z.object({
  complexity: ComplexityLevelSchema,
  reasoning: z.string(),
  technologies: z.array(z.string()).optional(),
  estimatedHours: z.number().optional(),
});
export type ComplexityAnalysis = z.infer<typeof ComplexityAnalysisSchema>;

export interface StartAnalysisInput {
  repoUrl: string;
  provider: AIProvider;
  apiKey: string;
}
