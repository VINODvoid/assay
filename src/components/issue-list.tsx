"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { IssueCard } from "@/components/issue-card";
import { ComplexityFilter } from "@/components/complexity-filter";
import { RepoChat } from "@/components/repo-chat";
import { AlertCircle, Inbox, ExternalLink } from "lucide-react";
import type { ComplexityLevel } from "@/lib/types";

interface IssueListProps {
  analysisId: string;
}

export function IssueList({ analysisId }: IssueListProps) {
  const [filter, setFilter] = useState<ComplexityLevel | "all">("all");

  const { data, isLoading, error } = trpc.getResults.useQuery({
    analysisId,
    filter: filter === "all" ? undefined : filter,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Skeleton for header */}
        <div className="h-10 w-80 animate-pulse rounded-xl bg-surface" />
        {/* Skeleton for cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 w-full animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="font-medium text-destructive">Failed to load results</p>
            <p className="text-sm text-destructive/80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface">
            <svg className="h-5 w-5 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold">
              {data.owner}/{data.repo}
            </h2>
            <p className="text-sm text-muted-foreground">
              {data.counts.total} issues analyzed
            </p>
          </div>
        </div>
        <a
          href={`https://github.com/${data.owner}/${data.repo}/issues`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-surface hover:text-foreground"
        >
          View on GitHub
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Filters */}
      <ComplexityFilter
        selected={filter}
        onSelect={setFilter}
        counts={data.counts}
      />

      {/* Results */}
      {data.issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-surface/50 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {filter === "all"
              ? "No issues found"
              : `No ${filter} issues found`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.issues.map((issue, index) => (
            <div
              key={issue.number}
              className="reveal"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <IssueCard issue={issue} repoOwner={data.owner} repoName={data.repo} />
            </div>
          ))}
        </div>
      )}

      {/* Chat Assistant */}
      <RepoChat analysisId={analysisId} defaultProvider={data?.provider} />
    </div>
  );
}
