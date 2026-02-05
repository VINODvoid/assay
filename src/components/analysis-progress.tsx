"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface AnalysisProgressProps {
  analysisId: string;
  onComplete?: () => void;
}

export function AnalysisProgress({ analysisId, onComplete }: AnalysisProgressProps) {
  const { data, isLoading, error } = trpc.getStatus.useQuery(
    { analysisId },
    {
      refetchInterval: (query) => {
        const status = query.state.data?.status;
        if (status === "complete" || status === "error") {
          return false;
        }
        return 2000;
      },
    }
  );

  useEffect(() => {
    if (data?.status === "complete") {
      onComplete?.();
    }
  }, [data?.status, onComplete]);

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
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
            <p className="font-medium text-destructive">Error loading analysis</p>
            <p className="text-sm text-destructive/80">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { status, progress } = data;
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-medium text-destructive">Analysis Failed</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {data.error || "An error occurred during analysis"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "complete") {
    return (
      <div className="rounded-2xl border border-beginner/30 bg-beginner/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-beginner/15">
            <CheckCircle className="h-5 w-5 text-beginner" />
          </div>
          <p className="font-medium">Analysis complete!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">Analyzing Issues</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "pending"
              ? "Preparing analysis..."
              : `Analyzed ${progress.current} of ${progress.total} issues`}
          </p>
          <div className="mt-4">
            {/* Custom progress bar */}
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-gradient-to-r from-ring/80 to-ring transition-all duration-500 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
