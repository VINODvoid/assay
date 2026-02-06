"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { Loader2, ChevronDown, Eye, EyeOff } from "lucide-react";
import type { AIProvider } from "@/lib/types";

const providers: { value: AIProvider; label: string; free?: boolean }[] = [
  { value: "groq", label: "Llama 4 Scout", free: true },
  { value: "anthropic", label: "Claude" },
  { value: "openai", label: "GPT-4o" },
  { value: "google", label: "Gemini" },
];

const issueCounts = [
  { value: 10, label: "10" },
  { value: 20, label: "20" },
  { value: 50, label: "50" },
  { value: 100, label: "100" },
];

export function RepoInput() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [provider, setProvider] = useState<AIProvider>("groq");
  const [apiKey, setApiKey] = useState("");
  const [maxIssues, setMaxIssues] = useState(20);
  const [error, setError] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const startAnalysis = trpc.startAnalysis.useMutation({
    onSuccess: (data) => {
      router.push(`/analyze/${data.analysisId}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!repoUrl.trim()) {
      setError("Please enter a repository URL");
      return;
    }

    startAnalysis.mutate({
      repoUrl: repoUrl.trim(),
      provider,
      apiKey: apiKey.trim() || undefined,
      maxIssues,
    });
  };

  const selectedProvider = providers.find((p) => p.value === provider);

  return (
    <div className="glass-card rounded-2xl p-6 transition-all duration-300">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Repository URL */}
        <div>
          <label
            htmlFor="repo-url"
            className="mb-2 block text-[13px] font-medium text-muted-foreground"
          >
            Repository
          </label>
          <input
            id="repo-url"
            type="text"
            placeholder="owner/repo or full URL"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            disabled={startAnalysis.isPending}
            className="input-glow h-11 w-full rounded-xl border border-border/50 bg-background/40 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 focus:border-ring/50 focus:bg-background/60 focus:outline-none disabled:opacity-50"
          />
        </div>

        {/* Provider and Issues row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Provider Select */}
          <div>
            <label
              htmlFor="provider"
              className="mb-2 block text-[13px] font-medium text-muted-foreground"
            >
              Model
            </label>
            <div className="relative">
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as AIProvider)}
                disabled={startAnalysis.isPending}
                className="h-11 w-full appearance-none rounded-xl border border-border/50 bg-background/40 pl-4 pr-10 text-sm text-foreground transition-all duration-200 focus:border-ring/50 focus:bg-background/60 focus:outline-none disabled:opacity-50"
              >
                {providers.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                    {p.free ? " (Free)" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            </div>
          </div>

          {/* Max Issues Select */}
          <div>
            <label
              htmlFor="max-issues"
              className="mb-2 block text-[13px] font-medium text-muted-foreground"
            >
              Issues
            </label>
            <div className="relative">
              <select
                id="max-issues"
                value={maxIssues}
                onChange={(e) => setMaxIssues(parseInt(e.target.value))}
                disabled={startAnalysis.isPending}
                className="h-11 w-full appearance-none rounded-xl border border-border/50 bg-background/40 pl-4 pr-10 text-sm text-foreground transition-all duration-200 focus:border-ring/50 focus:bg-background/60 focus:outline-none disabled:opacity-50"
              >
                {issueCounts.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
            </div>
          </div>
        </div>

        {/* API Key */}
        <div>
          <label
            htmlFor="api-key"
            className="mb-2 block text-[13px] font-medium text-muted-foreground"
          >
            API Key <span className="text-muted-foreground/50">(optional if set in .env)</span>
            {selectedProvider?.free && (
              <a
                href="https://console.groq.com"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-ring/70 hover:text-ring"
              >
                Get free key →
              </a>
            )}
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showApiKey ? "text" : "password"}
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={startAnalysis.isPending}
              className="input-glow h-11 w-full rounded-xl border border-border/50 bg-background/40 px-4 pr-11 text-sm text-foreground placeholder:text-muted-foreground/40 transition-all duration-200 focus:border-ring/50 focus:bg-background/60 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground/40">
            Sent directly to provider · Never stored · Uses .env key if empty
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={startAnalysis.isPending}
          className="btn-primary h-12 w-full rounded-xl text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          {startAnalysis.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </span>
          ) : (
            "Analyze Issues"
          )}
        </button>
      </form>
    </div>
  );
}
