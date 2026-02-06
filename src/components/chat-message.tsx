"use client";

import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ring/10">
          <Bot className="h-4 w-4 text-ring" />
        </div>
      )}

      <div className={`group relative max-w-[80%] ${isUser ? "order-first" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-ring/10 text-foreground"
              : "bg-surface/80 text-foreground"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-sm prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  a: ({ node, ...props }) => (
                    <a
                      {...props}
                      className="text-ring hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  ),
                  code: ({ node, inline, ...props }) =>
                    inline ? (
                      <code
                        {...props}
                        className="rounded bg-background/50 px-1 py-0.5 font-mono text-xs"
                      />
                    ) : (
                      <code
                        {...props}
                        className="block rounded-lg bg-background/50 p-3 font-mono text-xs"
                      />
                    ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && (
          <button
            onClick={handleCopy}
            className="absolute -bottom-6 right-0 flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ring/10">
          <User className="h-4 w-4 text-ring" />
        </div>
      )}
    </div>
  );
}
