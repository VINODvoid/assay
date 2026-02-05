"use client";

import { RepoInput } from "@/components/repo-input";

export default function HomePage() {
  return (
    <main className="relative min-h-screen">
      {/* Ambient background */}
      <div className="ambient-glow" />
      <div className="pointer-events-none fixed inset-0 dot-pattern opacity-40" />

      {/* Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
        {/* Hero section */}
        <div className="mb-16 flex flex-col items-center reveal">
          {/* Logo */}
          <div className="relative mb-10">
            {/* Glow behind logo */}
            <div className="absolute -inset-8 rounded-full bg-glow/20 blur-3xl logo-shimmer" />

            {/* Logo icon */}
            <div className="relative">
              <svg
                width="56"
                height="64"
                viewBox="0 0 42 48"
                fill="none"
                className="drop-shadow-2xl"
              >
                <path
                  d="m14.1061 19.6565c5.499-2.6299 9.8025-7.0929 12.2731-12.67168-1.5939-1.67362-3.666-2.86907-5.8975-3.58634l-1.1954-.39848c-.0797.15939-.1594.39849-.1594.55788-1.9127 5.41936-5.8178 9.80262-11.07766 12.27322-3.66599 1.7533-6.37564 4.9412-7.650763 8.7666l-.398477 1.1955c.159391.0797.39848.1593.557871.1593 1.514209.5579 3.028419 1.2752 4.462939 2.1519 1.99238-3.5864 5.18019-6.6148 9.08529-8.4479z"
                  fill="currentColor"
                />
                <path
                  d="m37.2173 19.9753c-2.9487 4.463-7.0132 8.0494-12.034 10.4403-4.0645 1.9127-7.1726 5.499-8.6071 9.8026l-.3985 1.3549c1.5142 1.3548 3.3472 2.3909 5.3396 3.0284l1.1955.3985c.0796-.1594.1593-.3985.1593-.5579 1.9127-5.4193 5.8178-9.8026 11.0777-12.2732 3.666-1.7533 6.4553-4.9412 7.6507-8.7666l.3985-1.1954c-1.6736-.4782-3.2675-1.2752-4.7817-2.2316z"
                  fill="currentColor"
                  opacity="0.5"
                />
                <path
                  d="m12.9903 37.4284c1.9924-4.7818 5.6584-8.6869 10.3604-10.9184 4.3035-2.0721 7.8898-5.26 10.3604-9.1651-1.833-1.7533-3.3472-3.7458-4.463-6.1366-2.9487 5.4193-7.571 9.8026-13.2294 12.5123-3.2675 1.5142-5.8974 4.1442-7.49136 7.3321 1.75326 1.6736 3.18786 3.7457 4.30356 6.0569 0 0 .0797.1594.1594.3188z"
                  fill="currentColor"
                  opacity="0.7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="mb-4 text-center text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Assay
          </h1>

          {/* Tagline */}
          <p className="mb-6 text-center text-lg text-muted-foreground">
            Analyze GitHub issues by complexity
          </p>

          {/* Badges preview */}
          <div className="flex items-center gap-2">
            <span className="badge-beginner rounded-full px-3 py-1 text-xs font-medium">
              Beginner
            </span>
            <span className="badge-intermediate rounded-full px-3 py-1 text-xs font-medium">
              Intermediate
            </span>
            <span className="badge-advanced rounded-full px-3 py-1 text-xs font-medium">
              Advanced
            </span>
          </div>
        </div>

        {/* Form */}
        <div className="w-full max-w-[420px] reveal reveal-delay-2">
          <RepoInput />
        </div>

        {/* Footer */}
        <p className="mt-16 text-center text-xs text-muted-foreground/50 reveal reveal-delay-4">
          Bring your own API key · Works with public repositories
        </p>
      </div>
    </main>
  );
}
