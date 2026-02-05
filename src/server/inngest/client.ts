import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "assay",
  name: "Assay - GitHub Issue Analyzer",
});

export type AnalysisStartedEvent = {
  name: "analysis/repo.submitted";
  data: {
    analysisId: string;
    owner: string;
    repo: string;
    provider: "anthropic" | "openai" | "google";
    apiKey: string;
    maxIssues: number;
  };
};
