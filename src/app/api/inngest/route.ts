import { serve } from "inngest/next";
import { inngest } from "@/server/inngest/client";
import { analyzeRepo } from "@/server/inngest/functions/analyze-repo";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeRepo],
});
