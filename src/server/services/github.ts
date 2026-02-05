import { Octokit } from "@octokit/rest";
import type { GitHubIssue } from "@/lib/types";

const octokit = new Octokit();

export async function fetchRepoIssues(
  owner: string,
  repo: string,
  maxIssues: number = 100
): Promise<GitHubIssue[]> {
  const issues: GitHubIssue[] = [];
  let page = 1;
  const perPage = 30;

  try {
    while (issues.length < maxIssues) {
      const response = await octokit.issues.listForRepo({
        owner,
        repo,
        state: "open",
        per_page: perPage,
        page,
        sort: "created",
        direction: "desc",
      });

      if (response.data.length === 0) {
        break;
      }

      for (const issue of response.data) {
        if (issue.pull_request) {
          continue;
        }

        issues.push({
          number: issue.number,
          title: issue.title,
          body: issue.body ?? null,
          labels: issue.labels
            .map((label) => (typeof label === "string" ? label : label.name))
            .filter((name): name is string => !!name),
          html_url: issue.html_url,
          comments: issue.comments,
          created_at: issue.created_at,
          user: issue.user?.login ?? null,
        });

        if (issues.length >= maxIssues) {
          break;
        }
      }

      if (response.data.length < perPage) {
        break;
      }

      page++;
    }

    return issues;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Not Found")) {
        throw new Error(`Repository ${owner}/${repo} not found or is private`);
      }
      if (error.message.includes("rate limit")) {
        throw new Error(
          "GitHub API rate limit exceeded. Please try again later or use a GitHub token."
        );
      }
      throw new Error(`Failed to fetch issues: ${error.message}`);
    }
    throw new Error("Failed to fetch issues from GitHub");
  }
}

export async function validateRepo(owner: string, repo: string): Promise<boolean> {
  try {
    await octokit.repos.get({ owner, repo });
    return true;
  } catch {
    return false;
  }
}
