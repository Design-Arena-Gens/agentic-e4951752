"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const assistantIntro =
  "I'm Orbit, a lightweight AI agent. Share your goal and I'll help outline next steps.";

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      content: assistantIntro,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const canSubmit = draft.trim().length > 0 && !isLoading;

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    const userMessage: ChatMessage = { id: createId(), role: "user", content: draft.trim() };

    const optimisticHistory = [...messages, userMessage];
    setMessages(optimisticHistory);
    setDraft("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: optimisticHistory.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { reply: string };
      const assistantMessage: ChatMessage = { id: createId(), role: "assistant", content: data.reply.trim() };

      setMessages((previous) => [...previous, assistantMessage]);
    } catch (agentError) {
      console.error(agentError);
      const fallback: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: "Something went wrong when contacting the agent. Try again in a moment.",
      };
      setMessages((previous) => [...previous, fallback]);
      setError(
        agentError instanceof Error ? agentError.message : "Unknown error",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const placeholder = useMemo(() => {
    if (isLoading) {
      return "Orbit is thinking...";
    }

    if (messages.length <= 1) {
      return "Ask for a plan, next steps, or break down a problem.";
    }

    return "Type your next prompt...";
  }, [isLoading, messages.length]);

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 font-sans text-zinc-900 transition-colors dark:bg-zinc-950 dark:text-zinc-100">
      <header className="border-b border-white/10 bg-white/70 backdrop-blur dark:border-white/5 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Orbit</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              A focused agent that helps break down ideas into actionable moves.
            </p>
          </div>
          <span className="rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
            Online
          </span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-28 pt-6 sm:px-6">
        <div
          ref={listRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-zinc-200/60 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70"
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {message.content.split("\n").map((line, index) => (
                  <p key={index} className="whitespace-pre-wrap">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900/70"
        >
          <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Message Orbit
          </label>
          <textarea
            className="h-28 w-full resize-none rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            disabled={isLoading}
          />
          <div className="flex items-center justify-between">
            {error ? (
              <p className="text-xs text-rose-500">
                {error}. Please try again.
              </p>
            ) : (
              <span className="text-xs text-zinc-500">
                Orbit crafts structured plans and clear next steps.
              </span>
            )}
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-400/60"
            >
              {isLoading ? "Thinking…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
