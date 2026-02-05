"use client";

import { ExternalLink, MessageSquare } from "lucide-react";
import type { AnalyzedIssue } from "@/lib/types";

interface IssueCardProps {
  issue: AnalyzedIssue;
}

export function IssueCard({ issue }: IssueCardProps) {
  return (
    <article className="issue-card group relative rounded-2xl transition-all duration-300">
      {/* Complexity indicator line */}
      <div
        className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full transition-all duration-300 group-hover:h-[calc(100%-2rem)] ${
          issue.complexity === "beginner"
            ? "bg-beginner"
            : issue.complexity === "intermediate"
              ? "bg-intermediate"
              : "bg-advanced"
        }`}
      />

      <div className="p-5 pl-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="shrink-0 text-sm font-mono text-muted-foreground/70">
                #{issue.number}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  issue.complexity === "beginner"
                    ? "badge-beginner"
                    : issue.complexity === "intermediate"
                      ? "badge-intermediate"
                      : "badge-advanced"
                }`}
              >
                {issue.complexity}
              </span>
            </div>
            <h3 className="mt-2 font-medium leading-snug">
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline decoration-foreground/30 underline-offset-2 transition-colors hover:text-ring"
              >
                {issue.title}
              </a>
            </h3>
          </div>
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-xl p-2 text-muted-foreground/40 transition-all duration-200 hover:bg-surface hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        {/* Reasoning */}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {issue.reasoning}
        </p>

        {/* Footer */}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground/60">
          {issue.user && (
            <span>by {issue.user}</span>
          )}
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {issue.comments}
          </span>
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {issue.labels.slice(0, 4).map((label) => (
                <span
                  key={label}
                  className="inline-flex rounded-md bg-surface px-2 py-0.5 text-xs text-muted-foreground/70"
                >
                  {label}
                </span>
              ))}
              {issue.labels.length > 4 && (
                <span className="text-muted-foreground/50">
                  +{issue.labels.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
