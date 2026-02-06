import type { AnalysisResult, AnalyzedIssue, AnalysisStatus, AIProvider } from "@/lib/types";

const analysisStore = new Map<string, AnalysisResult>();

export function createAnalysis(
  id: string,
  repoUrl: string,
  owner: string,
  repo: string,
  provider?: AIProvider
): AnalysisResult {
  const analysis: AnalysisResult = {
    id,
    repoUrl,
    owner,
    repo,
    status: "pending",
    progress: { current: 0, total: 0 },
    issues: [],
    provider,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  analysisStore.set(id, analysis);
  return analysis;
}

export function getAnalysis(id: string): AnalysisResult | undefined {
  return analysisStore.get(id);
}

export function updateAnalysisStatus(
  id: string,
  status: AnalysisStatus,
  error?: string
): void {
  const analysis = analysisStore.get(id);
  if (analysis) {
    analysis.status = status;
    analysis.updatedAt = new Date();
    if (error) {
      analysis.error = error;
    }
  }
}

export function updateAnalysisProgress(
  id: string,
  current: number,
  total: number
): void {
  const analysis = analysisStore.get(id);
  if (analysis) {
    analysis.progress = { current, total };
    analysis.updatedAt = new Date();
  }
}

export function addAnalyzedIssue(id: string, issue: AnalyzedIssue): void {
  const analysis = analysisStore.get(id);
  if (analysis) {
    analysis.issues.push(issue);
    analysis.updatedAt = new Date();
  }
}

export function setAnalysisIssues(id: string, issues: AnalyzedIssue[]): void {
  const analysis = analysisStore.get(id);
  if (analysis) {
    analysis.issues = issues;
    analysis.updatedAt = new Date();
  }
}
