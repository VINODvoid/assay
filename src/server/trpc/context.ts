import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  return {
    headers: opts.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
