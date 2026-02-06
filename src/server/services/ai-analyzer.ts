import { generateObject } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import type { GitHubIssue, AIProvider, ComplexityAnalysis } from "@/lib/types";

const ComplexityResponseSchema = z.object({
  complexity: z.enum(["beginner", "intermediate", "advanced"]),
  reasoning: z.string(),
});

const BatchComplexityResponseSchema = z.object({
  analyses: z.array(
    z.object({
      issueNumber: z.number(),
      complexity: z.enum(["beginner", "intermediate", "advanced"]),
      reasoning: z.string(),
      technologies: z.array(z.string()).optional(),
      estimatedHours: z.number().optional(),
    })
  ),
});

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

function buildBatchPrompt(issues: GitHubIssue[]): string {
  const issuesList = issues
    .map((issue) => {
      const labelsStr = issue.labels.length > 0 ? issue.labels.join(", ") : "None";
      const bodyStr = issue.body
        ? issue.body.substring(0, 500)
        : "No description";
      return `Issue #${issue.number}: "${issue.title}"
Labels: ${labelsStr}
Body: ${bodyStr}
Comments: ${issue.comments}`;
    })
    .join("\n\n---\n\n");

  return `Analyze these GitHub issues and rate each one's complexity for contributors.

${issuesList}

Rate each issue as:
- BEGINNER: Good first issue, clear scope, minimal codebase knowledge
- INTERMEDIATE: Requires codebase understanding, moderate complexity
- ADVANCED: Complex changes, deep expertise needed, architectural impact

For each issue, also identify:
- **technologies**: Array of technologies/frameworks needed (e.g., ["React", "TypeScript", "CSS"])
- **estimatedHours**: Rough estimate of hours needed (1-40)
- **reasoning**: Brief explanation (1-2 sentences)

Return JSON with "analyses" array containing objects with "issueNumber", "complexity", "reasoning", "technologies", and "estimatedHours".`;
}

export async function analyzeIssuesBatch(
  issues: GitHubIssue[],
  provider: AIProvider,
  apiKey: string
): Promise<Map<number, ComplexityAnalysis>> {
  const model = getModel(provider, apiKey);
  const prompt = buildBatchPrompt(issues);
  const results = new Map<number, ComplexityAnalysis>();

  try {
    const { object } = await generateObject({
      model,
      schema: BatchComplexityResponseSchema,
      prompt,
    });

    for (const analysis of object.analyses) {
      results.set(analysis.issueNumber, {
        complexity: analysis.complexity,
        reasoning: analysis.reasoning,
        technologies: analysis.technologies,
        estimatedHours: analysis.estimatedHours,
      });
    }

    // Fill in any missing issues with default
    for (const issue of issues) {
      if (!results.has(issue.number)) {
        results.set(issue.number, {
          complexity: "intermediate",
          reasoning: "Unable to analyze this issue",
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Batch analysis failed:", error);
    // Return defaults for all issues
    for (const issue of issues) {
      results.set(issue.number, {
        complexity: "intermediate",
        reasoning:
          error instanceof Error
            ? `Analysis failed: ${error.message}`
            : "Analysis failed",
      });
    }
    return results;
  }
}

function buildPrompt(issue: GitHubIssue): string {
  const labelsStr = issue.labels.length > 0 ? issue.labels.join(", ") : "None";
  const bodyStr = issue.body
    ? issue.body.substring(0, 2000)
    : "No description provided";

  return `Analyze this GitHub issue and rate its complexity for a contributor looking to work on it.

Issue Title: ${issue.title}

Issue Body:
${bodyStr}

Labels: ${labelsStr}
Comments: ${issue.comments}

Rate the complexity as one of:
- BEGINNER: Good first issue, clear scope, minimal codebase knowledge required, well-defined steps
- INTERMEDIATE: Requires some codebase understanding, moderate complexity, may need to touch multiple files
- ADVANCED: Complex changes required, deep expertise needed, architectural impact, or ambiguous scope

Consider these factors:
1. Clarity of requirements
2. Scope of changes
3. Technical depth required
4. Prior codebase knowledge needed
5. Existing labels (e.g., "good first issue" suggests beginner)

Return your analysis as JSON with "complexity" (beginner/intermediate/advanced) and "reasoning" (brief explanation).`;
}

export async function analyzeIssue(
  issue: GitHubIssue,
  provider: AIProvider,
  apiKey: string
): Promise<ComplexityAnalysis> {
  const model = getModel(provider, apiKey);
  const prompt = buildPrompt(issue);

  try {
    const { object } = await generateObject({
      model,
      schema: ComplexityResponseSchema,
      prompt,
    });

    return {
      complexity: object.complexity,
      reasoning: object.reasoning,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("API key") || error.message.includes("401")) {
        throw new Error(`Invalid ${provider} API key`);
      }
      if (error.message.includes("rate") || error.message.includes("429")) {
        throw new Error(`${provider} rate limit exceeded. Please try again later.`);
      }
      throw new Error(`AI analysis failed: ${error.message}`);
    }
    throw new Error("AI analysis failed");
  }
}
