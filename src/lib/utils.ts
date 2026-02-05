import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ParsedGitHubUrl {
  owner: string;
  repo: string;
}

export function parseGitHubUrl(url: string): ParsedGitHubUrl | null {
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/?$/,
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\/issues\/?$/,
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)\.git$/,
    /^([^\/]+)\/([^\/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ""),
      };
    }
  }

  return null;
}

export function generateAnalysisId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function getComplexityColor(complexity: string): string {
  switch (complexity) {
    case "beginner":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "advanced":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  }
}

export function getComplexityOrder(complexity: string): number {
  switch (complexity) {
    case "beginner":
      return 1;
    case "intermediate":
      return 2;
    case "advanced":
      return 3;
    default:
      return 4;
  }
}
