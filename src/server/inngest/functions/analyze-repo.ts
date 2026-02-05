import { inngest, type AnalysisStartedEvent } from "../client";
import { fetchRepoIssues } from "@/server/services/github";
import { analyzeIssue } from "@/server/services/ai-analyzer";
import {
  updateAnalysisStatus,
  updateAnalysisProgress,
  setAnalysisIssues,
} from "@/server/store";
import type { AnalyzedIssue } from "@/lib/types";

export const analyzeRepo = inngest.createFunction(
  {
    id: "analyze-repo",
    name: "Analyze Repository Issues",
    retries: 1,
  },
  { event: "analysis/repo.submitted" },
  async ({ event, step }) => {
    const { analysisId, owner, repo, provider, apiKey, maxIssues } =
      event.data as AnalysisStartedEvent["data"];

    await step.run("update-status-processing", async () => {
      updateAnalysisStatus(analysisId, "processing");
    });

    const issues = await step.run("fetch-issues", async () => {
      const fetchedIssues = await fetchRepoIssues(owner, repo, maxIssues);
      updateAnalysisProgress(analysisId, 0, fetchedIssues.length);
      return fetchedIssues;
    });

    const analyzedIssues: AnalyzedIssue[] = [];

    for (let i = 0; i < issues.length; i++) {
      const issue = issues[i];
      const analyzed = await step.run(`analyze-issue-${issue.number}`, async () => {
        try {
          const analysis = await analyzeIssue(issue, provider, apiKey);
          return {
            ...issue,
            complexity: analysis.complexity,
            reasoning: analysis.reasoning,
          };
        } catch (error) {
          return {
            ...issue,
            complexity: "intermediate" as const,
            reasoning:
              error instanceof Error
                ? `Analysis failed: ${error.message}`
                : "Analysis failed",
          };
        }
      });

      analyzedIssues.push(analyzed);

      await step.run(`update-progress-${i}`, async () => {
        updateAnalysisProgress(analysisId, i + 1, issues.length);
        setAnalysisIssues(analysisId, analyzedIssues);
      });
    }

    await step.run("mark-complete", async () => {
      updateAnalysisStatus(analysisId, "complete");
    });

    return { success: true, issuesAnalyzed: analyzedIssues.length };
  }
);
