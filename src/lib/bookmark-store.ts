import type { AnalyzedIssue } from "./types";

const STORAGE_KEY = "assay_bookmarks";

export interface Bookmark {
  issue: AnalyzedIssue;
  repoOwner: string;
  repoName: string;
  bookmarkedAt: string;
  notes?: string;
}

export function getBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function addBookmark(
  issue: AnalyzedIssue,
  repoOwner: string,
  repoName: string,
  notes?: string
): void {
  const bookmarks = getBookmarks();

  // Check if already bookmarked
  const exists = bookmarks.some(
    (b) => b.issue.number === issue.number && b.repoOwner === repoOwner && b.repoName === repoName
  );

  if (!exists) {
    bookmarks.unshift({
      issue,
      repoOwner,
      repoName,
      bookmarkedAt: new Date().toISOString(),
      notes,
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }
}

export function removeBookmark(issueNumber: number, repoOwner: string, repoName: string): void {
  const bookmarks = getBookmarks();
  const filtered = bookmarks.filter(
    (b) => !(b.issue.number === issueNumber && b.repoOwner === repoOwner && b.repoName === repoName)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function isBookmarked(issueNumber: number, repoOwner: string, repoName: string): boolean {
  const bookmarks = getBookmarks();
  return bookmarks.some(
    (b) => b.issue.number === issueNumber && b.repoOwner === repoOwner && b.repoName === repoName
  );
}

export function updateBookmarkNotes(
  issueNumber: number,
  repoOwner: string,
  repoName: string,
  notes: string
): void {
  const bookmarks = getBookmarks();
  const bookmark = bookmarks.find(
    (b) => b.issue.number === issueNumber && b.repoOwner === repoOwner && b.repoName === repoName
  );

  if (bookmark) {
    bookmark.notes = notes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  }
}

export function exportBookmarks(): string {
  const bookmarks = getBookmarks();
  return JSON.stringify(bookmarks, null, 2);
}

export function exportBookmarksAsCSV(): string {
  const bookmarks = getBookmarks();
  const headers = ["Repository", "Issue Number", "Title", "Complexity", "Technologies", "Estimated Hours", "URL", "Bookmarked At", "Notes"];

  const rows = bookmarks.map((b) => [
    `${b.repoOwner}/${b.repoName}`,
    b.issue.number.toString(),
    `"${b.issue.title.replace(/"/g, '""')}"`,
    b.issue.complexity,
    `"${(b.issue.technologies || []).join(", ")}"`,
    b.issue.estimatedHours?.toString() || "",
    b.issue.html_url,
    b.bookmarkedAt,
    `"${(b.notes || "").replace(/"/g, '""')}"`,
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}
