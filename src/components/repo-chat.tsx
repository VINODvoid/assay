"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { ChatMessage } from "./chat-message";
import { Send, Sparkles, Loader2, MessageSquare, X, Key, Eye, EyeOff } from "lucide-react";
import type { AIProvider } from "@/lib/types";

interface RepoChatProps {
  analysisId: string;
  defaultProvider?: AIProvider;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function RepoChat({ analysisId, defaultProvider = "groq" }: RepoChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: suggestedData } = trpc.getSuggestedQuestions.useQuery(
    { analysisId },
    { enabled: isOpen }
  );

  const chatMutation = trpc.chat.useMutation();

  useEffect(() => {
    // Load API key from localStorage
    const stored = localStorage.getItem("assay_api_key");
    if (stored) {
      setApiKey(stored);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("assay_api_key", apiKey.trim());
      setShowApiKeyInput(false);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isStreaming) {
      return;
    }

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    try {
      const stream = await chatMutation.mutateAsync({
        analysisId,
        message: text,
        provider: defaultProvider,
        apiKey: apiKey || undefined,
        history: messages,
      });

      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      // Read the stream
      const reader = stream.textStream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        assistantContent += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: assistantContent,
          };
          return newMessages;
        });
      }
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-ring/90 to-ring shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      >
        <MessageSquare className="h-6 w-6 text-primary-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[420px] flex-col rounded-2xl border border-border/50 bg-background/95 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ring/10">
            <Sparkles className="h-4 w-4 text-ring" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Repository Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask anything about this repo</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowApiKeyInput(true)}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            title="Set API Key"
          >
            <Key className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* API Key Input */}
      {showApiKeyInput && (
        <div className="border-b border-border/50 bg-surface/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">API Key</p>
            <button
              onClick={() => setShowApiKeyInput(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key (optional if in .env)"
              className="w-full rounded-xl border border-border/50 bg-background px-4 py-2 pr-10 text-sm focus:border-ring/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <button
            onClick={handleSaveApiKey}
            className="w-full rounded-xl bg-ring px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-ring/90"
          >
            {apiKey.trim() ? "Save API Key" : "Use .env Key"}
          </button>
          <p className="text-xs text-muted-foreground/50">
            {apiKey.trim()
              ? "Stored locally · Never sent to our servers"
              : "Will use API key from .env file"}
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center space-y-4 px-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-ring/10">
              <Sparkles className="h-6 w-6 text-ring" />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm">Ask me anything!</p>
              <p className="text-xs text-muted-foreground mt-1">
                I can help you understand issues, PRs, and the repository
              </p>
            </div>

            {/* Suggested Questions */}
            {suggestedData?.questions && (
              <div className="w-full space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Try asking:</p>
                <div className="space-y-2">
                  {suggestedData.questions.slice(0, 3).map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      disabled={isStreaming}
                      className="w-full rounded-xl border border-border/50 bg-surface/50 px-3 py-2 text-left text-xs text-muted-foreground transition-all hover:border-ring/40 hover:bg-surface hover:text-foreground disabled:opacity-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            role={message.role}
            content={message.content}
          />
        ))}

        {isStreaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ring/10">
              <Sparkles className="h-4 w-4 text-ring" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl bg-surface/80 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about issues, PRs, or anything..."
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border/50 bg-surface/50 px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:border-ring/50 focus:bg-surface focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isStreaming}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ring text-primary-foreground transition-all hover:bg-ring/90 disabled:opacity-50 disabled:hover:bg-ring"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground/50">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
