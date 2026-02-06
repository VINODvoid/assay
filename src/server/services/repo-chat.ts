import { streamText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { AIProvider, AnalyzedIssue } from "@/lib/types";
import { fetchRepoPullRequests, fetchRepoReadme, fetchRepoMetadata } from "./github";

function getModel(provider: AIProvider, apiKey: string) {
  switch (provider) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic("claude-sonnet-4-20250514");
    }
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai("gpt-4o-mini");
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google("gemini-1.5-flash");
    }
    case "groq": {
      const groq = createGroq({ apiKey });
      return groq("meta-llama/llama-4-scout-17b-16e-instruct");
    }
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}

interface RepositoryContext {
  owner: string;
  repo: string;
  issues: AnalyzedIssue[];
  readme?: string | null;
  metadata?: any;
  pullRequests?: any[];
}

async function buildRepositoryContext(
  owner: string,
  repo: string,
  issues: AnalyzedIssue[]
): Promise<RepositoryContext> {
  const [readme, metadata, pullRequests] = await Promise.all([
    fetchRepoReadme(owner, repo),
    fetchRepoMetadata(owner, repo),
    fetchRepoPullRequests(owner, repo, 10),
  ]);

  return {
    owner,
    repo,
    issues,
    readme,
    metadata,
    pullRequests,
  };
}

function buildSystemPrompt(context: RepositoryContext): string {
  const { owner, repo, issues, readme, metadata, pullRequests } = context;

  let prompt = `You are a helpful AI assistant that answers questions about the GitHub repository ${owner}/${repo}.

You have access to the following repository information:

## Repository Metadata
${metadata ? `
- Name: ${metadata.fullName}
- Description: ${metadata.description || "No description"}
- Language: ${metadata.language || "Not specified"}
- Stars: ${metadata.stargazers}
- Forks: ${metadata.forks}
- Open Issues: ${metadata.openIssues}
- Topics: ${metadata.topics.join(", ") || "None"}
- License: ${metadata.license || "Not specified"}
` : "Metadata not available"}

## Issues (${issues.length} analyzed)
${issues.slice(0, 20).map((issue) => `
### Issue #${issue.number}: ${issue.title}
- Complexity: ${issue.complexity}
- Labels: ${issue.labels.join(", ") || "None"}
- Comments: ${issue.comments}
- Reasoning: ${issue.reasoning}
- URL: ${issue.html_url}
${issue.body ? `- Description: ${issue.body.substring(0, 200)}...` : ""}
`).join("\n")}

${issues.length > 20 ? `\n... and ${issues.length - 20} more issues` : ""}

## Recent Pull Requests
${pullRequests && pullRequests.length > 0 ? pullRequests.slice(0, 5).map((pr) => `
### PR #${pr.number}: ${pr.title}
- State: ${pr.state}${pr.merged_at ? " (merged)" : ""}
- Author: ${pr.user}
- Labels: ${pr.labels.join(", ") || "None"}
- URL: ${pr.html_url}
`).join("\n") : "No recent PRs available"}

${readme ? `
## README (first 1000 characters)
${readme.substring(0, 1000)}...
` : ""}

When answering questions:
1. Be specific and reference issue numbers, PR numbers, or specific details
2. Use the complexity ratings to recommend appropriate issues for different skill levels
3. Provide links when mentioning specific issues or PRs
4. If you don't have enough information to answer accurately, say so
5. Be concise but informative
6. Format your responses in markdown for readability

Answer questions about:
- Issues (complexity, recommendations, filtering)
- Pull requests (status, activity)
- Repository information (languages, dependencies, structure)
- Contribution opportunities
- Project overview and direction`;

  return prompt;
}

export async function chatWithRepository(
  message: string,
  owner: string,
  repo: string,
  issues: AnalyzedIssue[],
  provider: AIProvider,
  apiKey: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
) {
  const model = getModel(provider, apiKey);
  const context = await buildRepositoryContext(owner, repo, issues);
  const systemPrompt = buildSystemPrompt(context);

  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  const result = await streamText({
    model,
    system: systemPrompt,
    messages,
    maxTokens: 1000,
    temperature: 0.7,
  });

  return result;
}

export function getSuggestedQuestions(issues: AnalyzedIssue[]): string[] {
  const beginnerCount = issues.filter((i) => i.complexity === "beginner").length;
  const intermediateCount = issues.filter((i) => i.complexity === "intermediate").length;
  const advancedCount = issues.filter((i) => i.complexity === "advanced").length;

  return [
    "What are the best beginner-friendly issues to start with?",
    "Which issues are related to documentation?",
    "Summarize the most active areas of development",
    `Are there any ${beginnerCount > 0 ? "beginner" : "intermediate"} issues related to UI/frontend?`,
    "What skills do I need to contribute to this project?",
    "Which issues have the most discussion?",
  ];
}
