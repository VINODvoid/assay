import { Octokit } from "@octokit/rest";
import type { GitHubIssue } from "@/lib/types";
import { env } from "@/lib/env";

const octokit = new Octokit({
  auth: env.githubToken,
});

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

export async function fetchRepoPullRequests(
  owner: string,
  repo: string,
  maxPRs: number = 20
) {
  try {
    const response = await octokit.pulls.list({
      owner,
      repo,
      state: "all",
      per_page: maxPRs,
      sort: "updated",
      direction: "desc",
    });

    return response.data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      body: pr.body ?? null,
      state: pr.state,
      html_url: pr.html_url,
      created_at: pr.created_at,
      updated_at: pr.updated_at,
      merged_at: pr.merged_at,
      user: pr.user?.login ?? null,
      labels: pr.labels
        .map((label) => (typeof label === "string" ? label : label.name))
        .filter((name): name is string => !!name),
    }));
  } catch (error) {
    console.error("Failed to fetch PRs:", error);
    return [];
  }
}

export async function fetchRepoReadme(owner: string, repo: string) {
  try {
    const response = await octokit.repos.getReadme({
      owner,
      repo,
    });

    // Decode base64 content
    const content = Buffer.from(response.data.content, "base64").toString("utf-8");
    return content;
  } catch (error) {
    console.error("Failed to fetch README:", error);
    return null;
  }
}

export async function fetchRepoMetadata(owner: string, repo: string) {
  try {
    const response = await octokit.repos.get({
      owner,
      repo,
    });

    return {
      name: response.data.name,
      fullName: response.data.full_name,
      description: response.data.description ?? null,
      language: response.data.language ?? null,
      stargazers: response.data.stargazers_count,
      forks: response.data.forks_count,
      openIssues: response.data.open_issues_count,
      topics: response.data.topics ?? [],
      homepage: response.data.homepage ?? null,
      license: response.data.license?.name ?? null,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  } catch (error) {
    console.error("Failed to fetch repo metadata:", error);
    return null;
  }
}
