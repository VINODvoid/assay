"use client";

import { useState, useEffect } from "react";
import { Bookmark } from "lucide-react";
import { addBookmark, removeBookmark, isBookmarked } from "@/lib/bookmark-store";
import type { AnalyzedIssue } from "@/lib/types";

interface BookmarkButtonProps {
  issue: AnalyzedIssue;
  repoOwner: string;
  repoName: string;
}

export function BookmarkButton({ issue, repoOwner, repoName }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    setBookmarked(isBookmarked(issue.number, repoOwner, repoName));
  }, [issue.number, repoOwner, repoName]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (bookmarked) {
      removeBookmark(issue.number, repoOwner, repoName);
      setBookmarked(false);
    } else {
      addBookmark(issue, repoOwner, repoName);
      setBookmarked(true);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`rounded-xl p-2 transition-all duration-200 ${
        bookmarked
          ? "bg-ring/20 text-ring hover:bg-ring/30"
          : "text-muted-foreground/40 hover:bg-surface hover:text-foreground"
      }`}
      title={bookmarked ? "Remove bookmark" : "Bookmark issue"}
    >
      <Bookmark
        className={`h-4 w-4 transition-all ${bookmarked ? "fill-current" : ""}`}
      />
    </button>
  );
}
