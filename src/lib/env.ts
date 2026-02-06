// Server-side environment variables
export const env = {
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  googleApiKey: process.env.GOOGLE_API_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,
} as const;

// Get API key for a provider (server-side)
export function getProviderApiKey(provider: string): string | undefined {
  switch (provider) {
    case "anthropic":
      return env.anthropicApiKey;
    case "openai":
      return env.openaiApiKey;
    case "google":
      return env.googleApiKey;
    case "groq":
      return env.groqApiKey;
    default:
      return undefined;
  }
}
