"use client";

import type { ComplexityLevel } from "@/lib/types";

interface ComplexityFilterProps {
  selected: ComplexityLevel | "all";
  onSelect: (filter: ComplexityLevel | "all") => void;
  counts: {
    beginner: number;
    intermediate: number;
    advanced: number;
    total: number;
  };
}

export function ComplexityFilter({ selected, onSelect, counts }: ComplexityFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <FilterButton
        active={selected === "all"}
        onClick={() => onSelect("all")}
        count={counts.total}
      >
        All
      </FilterButton>
      <FilterButton
        active={selected === "beginner"}
        onClick={() => onSelect("beginner")}
        count={counts.beginner}
        variant="beginner"
      >
        Beginner
      </FilterButton>
      <FilterButton
        active={selected === "intermediate"}
        onClick={() => onSelect("intermediate")}
        count={counts.intermediate}
        variant="intermediate"
      >
        Intermediate
      </FilterButton>
      <FilterButton
        active={selected === "advanced"}
        onClick={() => onSelect("advanced")}
        count={counts.advanced}
        variant="advanced"
      >
        Advanced
      </FilterButton>
    </div>
  );
}

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  count: number;
  variant?: "beginner" | "intermediate" | "advanced";
}

function FilterButton({ children, active, onClick, count, variant }: FilterButtonProps) {
  const getButtonStyles = () => {
    if (!active) {
      return "border-border/50 bg-background/40 text-muted-foreground hover:border-border hover:bg-surface hover:text-foreground";
    }

    switch (variant) {
      case "beginner":
        return "border-beginner/40 bg-beginner/10 text-beginner";
      case "intermediate":
        return "border-intermediate/40 bg-intermediate/10 text-intermediate";
      case "advanced":
        return "border-advanced/40 bg-advanced/10 text-advanced";
      default:
        return "border-ring/40 bg-ring/10 text-foreground";
    }
  };

  const getBadgeStyles = () => {
    if (!active) {
      return "bg-surface text-muted-foreground/70";
    }

    switch (variant) {
      case "beginner":
        return "bg-beginner/20 text-beginner";
      case "intermediate":
        return "bg-intermediate/20 text-intermediate";
      case "advanced":
        return "bg-advanced/20 text-advanced";
      default:
        return "bg-ring/20 text-foreground";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${getButtonStyles()}`}
    >
      {children}
      <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium transition-all duration-200 ${getBadgeStyles()}`}>
        {count}
      </span>
    </button>
  );
}
