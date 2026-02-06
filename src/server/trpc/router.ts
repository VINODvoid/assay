import { initTRPC } from "@trpc/server";
import { z } from "zod";
import type { Context } from "./context";
import { parseGitHubUrl, generateAnalysisId, getComplexityOrder } from "@/lib/utils";
import { AIProviderSchema, ComplexityLevelSchema } from "@/lib/types";
import {
  createAnalysis,
  getAnalysis,
  updateAnalysisStatus,
  updateAnalysisProgress,
  setAnalysisIssues,
} from "@/server/store";
import { fetchRepoIssues } from "@/server/services/github";
import { analyzeIssuesBatch } from "@/server/services/ai-analyzer";
import { chatWithRepository, getSuggestedQuestions } from "@/server/services/repo-chat";
import { getProviderApiKey } from "@/lib/env";
import type { AnalyzedIssue, AIProvider } from "@/lib/types";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  startAnalysis: publicProcedure
    .input(
      z.object({
        repoUrl: z.string().min(1, "Repository URL is required"),
        provider: AIProviderSchema,
        apiKey: z.string().optional(),
        maxIssues: z.number().min(1).max(100).default(20),
      })
    )
    .mutation(async ({ input }) => {
      const parsed = parseGitHubUrl(input.repoUrl);
      if (!parsed) {
        throw new Error("Invalid GitHub repository URL");
      }

      // Use provided API key or fall back to env variable
      const apiKey = input.apiKey || getProviderApiKey(input.provider);
      if (!apiKey) {
        throw new Error(`API key required for ${input.provider}. Please provide one or set it in .env`);
      }

      const { owner, repo } = parsed;
      const analysisId = generateAnalysisId();

      createAnalysis(analysisId, input.repoUrl, owner, repo, input.provider);

      // Process in background (non-blocking)
      processAnalysis(
        analysisId,
        owner,
        repo,
        input.provider,
        apiKey,
        input.maxIssues
      );

      return { analysisId };
    }),

  getStatus: publicProcedure
    .input(z.object({ analysisId: z.string() }))
    .query(({ input }) => {
      const analysis = getAnalysis(input.analysisId);
      if (!analysis) {
        throw new Error("Analysis not found");
      }

      return {
        id: analysis.id,
        status: analysis.status,
        progress: analysis.progress,
        provider: analysis.provider,
        error: analysis.error,
      };
    }),

  getResults: publicProcedure
    .input(
      z.object({
        analysisId: z.string(),
        filter: ComplexityLevelSchema.optional(),
      })
    )
    .query(({ input }) => {
      const analysis = getAnalysis(input.analysisId);
      if (!analysis) {
        throw new Error("Analysis not found");
      }

      let issues = [...analysis.issues];

      if (input.filter) {
        issues = issues.filter((issue) => issue.complexity === input.filter);
      }

      issues.sort(
        (a, b) => getComplexityOrder(a.complexity) - getComplexityOrder(b.complexity)
      );

      const counts = {
        beginner: analysis.issues.filter((i) => i.complexity === "beginner").length,
        intermediate: analysis.issues.filter((i) => i.complexity === "intermediate")
          .length,
        advanced: analysis.issues.filter((i) => i.complexity === "advanced").length,
        total: analysis.issues.length,
      };

      return {
        id: analysis.id,
        repoUrl: analysis.repoUrl,
        owner: analysis.owner,
        repo: analysis.repo,
        status: analysis.status,
        provider: analysis.provider,
        issues,
        counts,
      };
    }),

  chat: publicProcedure
    .input(
      z.object({
        analysisId: z.string(),
        message: z.string().min(1),
        provider: AIProviderSchema,
        apiKey: z.string().optional(),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional()
          .default([]),
      })
    )
    .mutation(async ({ input }) => {
      const analysis = getAnalysis(input.analysisId);
      if (!analysis) {
        throw new Error("Analysis not found");
      }

      if (analysis.status !== "complete") {
        throw new Error("Analysis must be complete before chatting");
      }

      // Use provided API key or fall back to env variable
      const apiKey = input.apiKey || getProviderApiKey(input.provider);
      if (!apiKey) {
        throw new Error(`API key required for ${input.provider}. Please provide one or set it in .env`);
      }

      const result = await chatWithRepository(
        input.message,
        analysis.owner,
        analysis.repo,
        analysis.issues,
        input.provider,
        apiKey,
        input.history
      );

      return result;
    }),

  getSuggestedQuestions: publicProcedure
    .input(z.object({ analysisId: z.string() }))
    .query(({ input }) => {
      const analysis = getAnalysis(input.analysisId);
      if (!analysis) {
        throw new Error("Analysis not found");
      }

      return {
        questions: getSuggestedQuestions(analysis.issues),
      };
    }),
});

// Batch size for processing issues (reduces API calls)
const BATCH_SIZE = 10;

async function processAnalysis(
  analysisId: string,
  owner: string,
  repo: string,
  provider: AIProvider,
  apiKey: string,
  maxIssues: number
) {
  try {
    updateAnalysisStatus(analysisId, "processing");

    const issues = await fetchRepoIssues(owner, repo, maxIssues);
    updateAnalysisProgress(analysisId, 0, issues.length);

    const analyzedIssues: AnalyzedIssue[] = [];

    // Process in batches to reduce API calls
    for (let i = 0; i < issues.length; i += BATCH_SIZE) {
      const batch = issues.slice(i, i + BATCH_SIZE);

      try {
        const results = await analyzeIssuesBatch(batch, provider, apiKey);

        for (const issue of batch) {
          const analysis = results.get(issue.number);
          analyzedIssues.push({
            ...issue,
            complexity: analysis?.complexity ?? "intermediate",
            reasoning: analysis?.reasoning ?? "Unable to analyze",
            technologies: analysis?.technologies,
            estimatedHours: analysis?.estimatedHours,
          });
        }
      } catch (error) {
        console.error(`Batch analysis failed for batch starting at ${i}:`, error);
        // Add failed issues with default values
        for (const issue of batch) {
          analyzedIssues.push({
            ...issue,
            complexity: "intermediate",
            reasoning:
              error instanceof Error
                ? `Analysis failed: ${error.message}`
                : "Analysis failed",
            technologies: undefined,
            estimatedHours: undefined,
          });
        }
      }

      updateAnalysisProgress(analysisId, Math.min(i + BATCH_SIZE, issues.length), issues.length);
      setAnalysisIssues(analysisId, analyzedIssues);

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < issues.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    updateAnalysisStatus(analysisId, "complete");
  } catch (error) {
    console.error("Analysis failed:", error);
    updateAnalysisStatus(
      analysisId,
      "error",
      error instanceof Error ? error.message : "Analysis failed"
    );
  }
}

export type AppRouter = typeof appRouter;
