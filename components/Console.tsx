"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentResult, Channel, Conversation } from "@/lib/types";
import type { PublicSettings } from "@/lib/settings";
import { CHANNEL_META, relativeTime } from "@/lib/ui";
import { Avatar } from "./Avatar";
import { ChannelBadge } from "./ChannelBadge";
import { MessageItem } from "./MessageItem";
import { SettingsModal } from "./SettingsModal";

type Filter = "all" | Channel;

export function Console({
  initialConversations,
  initialSettings,
}: {
  initialConversations: Conversation[];
  initialSettings: PublicSettings;
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [settings, setSettings] = useState(initialSettings);
  const [activeId, setActiveId] = useState(initialConversations[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [composerSeed, setComposerSeed] = useState("");
  const [simOn, setSimOn] = useState(false);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );

  const refresh = useCallback(async () => {
    const res = await fetch("/api/conversations", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setConversations(data.conversations);
  }, []);

  // Background inbound simulator: while ON, ask the server for a deterministic
  // inbound message every few seconds, then refresh.
  useEffect(() => {
    if (!simOn) return;
    const id = setInterval(async () => {
      await fetch("/api/simulator", { method: "POST" });
      await refresh();
    }, 5000);
    return () => clearInterval(id);
  }, [simOn, refresh]);

  // Light polling so simulated delivery-status transitions show up live.
  useEffect(() => {
    const id = setInterval(refresh, 2500);
    return () => clearInterval(id);
  }, [refresh]);

  const selectConversation = useCallback(
    async (id: string) => {
      setActiveId(id);
      setComposerSeed("");
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
      );
      await fetch("/api/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: id }),
      });
    },
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter !== "all" && c.channel !== filter) return false;
      if (!q) return true;
      return (
        c.contactName.toLowerCase().includes(q) ||
        c.contactNumber.includes(q) ||
        c.messages.some((m) => m.body.toLowerCase().includes(q))
      );
    });
  }, [conversations, filter, search]);

  return (
    <div className="flex h-[100dvh] flex-col bg-bg text-[#e6e8ee]">
      <TopBar
        filter={filter}
        setFilter={setFilter}
        search={search}
        setSearch={setSearch}
        mode={settings.mode}
        simOn={simOn}
        toggleSim={() => setSimOn((v) => !v)}
        onTriggerInbound={async () => {
          await fetch("/api/simulator", { method: "POST" });
          await refresh();
        }}
        onSettings={() => setSettingsOpen(true)}
      />

      <div className="flex min-h-0 flex-1">
        {/* LEFT: conversation list */}
        <aside className="flex w-full max-w-[340px] shrink-0 flex-col border-r border-border md:w-[320px] lg:w-[340px]">
          <div className="flex items-center justify-between px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b93a3]">
              Conversations
            </h2>
            <span className="text-[10px] text-[#6b7280]">{filtered.length}</span>
          </div>
          <ul className="min-h-0 flex-1 overflow-y-auto" data-testid="conversation-list">
            {filtered.map((c) => (
              <ConversationRow
                key={c.id}
                conversation={c}
                active={c.id === activeId}
                onClick={() => selectConversation(c.id)}
              />
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-8 text-center text-xs text-[#6b7280]">
                No conversations match.
              </li>
            )}
          </ul>
        </aside>

        {/* CENTER: thread */}
        <main className="flex min-w-0 flex-1 flex-col">
          {active ? (
            <Thread
              key={active.id}
              conversation={active}
              composerSeed={composerSeed}
              onSent={refresh}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#6b7280]">
              Select a conversation
            </div>
          )}
        </main>

        {/* RIGHT: AI agent */}
        <AgentPanel
          conversation={active}
          aiConfigured={settings.aiConfigured}
          aiProvider={settings.aiProvider}
          onUseReply={(text) => setComposerSeed(text)}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSaved={(s) => setSettings(s)}
        />
      )}
    </div>
  );
}

function TopBar({
  filter,
  setFilter,
  search,
  setSearch,
  mode,
  simOn,
  toggleSim,
  onTriggerInbound,
  onSettings,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  search: string;
  setSearch: (s: string) => void;
  mode: PublicSettings["mode"];
  simOn: boolean;
  toggleSim: () => void;
  onTriggerInbound: () => void;
  onSettings: () => void;
}) {
  const filters: Filter[] = ["all", "sms", "voice", "rcs"];
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-black text-white">
          R
        </div>
        <span className="text-sm font-semibold tracking-tight">Relay</span>
        <span
          className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#8b93a3] ring-1 ring-white/10"
          data-testid="mode-badge"
        >
          {mode === "live" ? "Live" : "Simulator"}
        </span>
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5" data-testid="channel-filter">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            data-testid={`filter-${f}`}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
              filter === f
                ? "bg-white/10 text-white"
                : "text-[#8b93a3] hover:text-[#c8cdd8]"
            }`}
          >
            {f === "all" ? "All" : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="relative min-w-[160px] flex-1">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations…"
          data-testid="search-input"
          className="w-full rounded-lg border border-border bg-bg-raised px-3 py-1.5 text-xs text-[#e6e8ee] placeholder:text-[#5b6373] focus:border-blue-500/50 focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTriggerInbound}
          data-testid="trigger-inbound"
          className="rounded-lg border border-border bg-bg-raised px-2.5 py-1.5 text-xs font-medium text-[#c8cdd8] transition hover:bg-bg-hover"
          title="Simulate an inbound message"
        >
          + Inbound
        </button>
        <button
          onClick={toggleSim}
          data-testid="toggle-sim"
          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ring-1 ${
            simOn
              ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
              : "bg-bg-raised text-[#8b93a3] ring-border hover:bg-bg-hover"
          }`}
          title="Auto-generate inbound traffic"
        >
          {simOn ? "Live feed ●" : "Live feed ○"}
        </button>
        <button
          onClick={onSettings}
          data-testid="open-settings"
          className="rounded-lg border border-border bg-bg-raised px-2.5 py-1.5 text-xs font-medium text-[#c8cdd8] transition hover:bg-bg-hover"
        >
          Settings
        </button>
      </div>
    </header>
  );
}

function ConversationRow({
  conversation,
  active,
  onClick,
}: {
  conversation: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const last = conversation.messages[conversation.messages.length - 1];
  const preview = last?.voice
    ? `Call · ${last.direction === "inbound" ? "inbound" : "outbound"}`
    : last?.body ?? "";
  return (
    <li>
      <button
        onClick={onClick}
        data-testid="conversation-row"
        data-conversation-id={conversation.id}
        className={`flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition ${
          active
            ? "border-l-blue-500 bg-white/[0.04]"
            : "border-l-transparent hover:bg-white/[0.02]"
        }`}
      >
        <Avatar name={conversation.contactName} channel={conversation.channel} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-[#e6e8ee]">
              {conversation.contactName}
            </span>
            <ChannelBadge channel={conversation.channel} />
            <span className="ml-auto shrink-0 text-[10px] text-[#6b7280]">
              {last ? relativeTime(last.createdAt) : ""}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span className="truncate text-xs text-[#8b93a3]">{preview}</span>
            {conversation.unread > 0 && (
              <span
                className="ml-auto flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-semibold text-white"
                data-testid="unread-badge"
              >
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function Thread({
  conversation,
  composerSeed,
  onSent,
}: {
  conversation: Conversation;
  composerSeed: string;
  onSent: () => Promise<void> | void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const meta = CHANNEL_META[conversation.channel];

  useEffect(() => {
    if (composerSeed) setDraft(composerSeed);
  }, [composerSeed]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id, body }),
      });
      setDraft("");
      await onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <Avatar name={conversation.contactName} channel={conversation.channel} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{conversation.contactName}</span>
            <ChannelBadge channel={conversation.channel} />
          </div>
          <div className="text-xs text-[#8b93a3]">{conversation.contactNumber}</div>
        </div>
        <span
          className="ml-auto text-[10px] font-medium uppercase tracking-wide"
          style={{ color: meta.color }}
        >
          {meta.label} channel
        </span>
      </div>

      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4"
        data-testid="thread-messages"
      >
        {conversation.messages.map((m) => (
          <MessageItem key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-bg-raised p-2 focus-within:border-blue-500/50">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={`Message ${conversation.contactName}…`}
            data-testid="composer-input"
            className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-sm text-[#e6e8ee] placeholder:text-[#5b6373] focus:outline-none"
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending}
            data-testid="composer-send"
            className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition enabled:hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

function AgentPanel({
  conversation,
  aiConfigured,
  aiProvider,
  onUseReply,
  onOpenSettings,
}: {
  conversation: Conversation | undefined;
  aiConfigured: boolean;
  aiProvider: PublicSettings["aiProvider"];
  onUseReply: (text: string) => void;
  onOpenSettings: () => void;
}) {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [conversation?.id]);

  const run = async (action: string) => {
    if (!conversation || !aiConfigured) return;
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: conversation.id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error === "no_ai_key" ? "Add a key in Settings." : "Agent failed.");
        return;
      }
      const data = await res.json();
      setResult(data.result);
    } finally {
      setLoading(null);
    }
  };

  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-l border-border lg:flex" data-testid="agent-panel">
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-500 to-blue-500 text-[11px] font-bold text-white">
          AI
        </div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[#8b93a3]">
          AI Agent
        </h2>
        {aiProvider && (
          <span className="ml-auto rounded bg-white/5 px-1.5 py-0.5 text-[9px] uppercase text-[#8b93a3] ring-1 ring-white/10">
            {aiProvider}
          </span>
        )}
      </div>

      {!aiConfigured && (
        <div
          className="mx-4 mb-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/80"
          data-testid="ai-gate-hint"
        >
          Add your OpenAI/Anthropic key in Settings to enable AI.
          <button
            onClick={onOpenSettings}
            className="mt-2 block w-full rounded-md bg-amber-500/15 px-2 py-1 text-[11px] font-medium text-amber-200 hover:bg-amber-500/25"
          >
            Open Settings
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-4 pb-2">
        <AgentButton label="Draft reply" testid="agent-draft" disabled={!aiConfigured} loading={loading === "draft"} onClick={() => run("draft")} />
        <AgentButton label="Auto-reply" testid="agent-autoreply" disabled={!aiConfigured} loading={loading === "autoreply"} onClick={async () => { await run("autoreply"); }} />
        <AgentButton label="Summarize" testid="agent-summarize" disabled={!aiConfigured} loading={loading === "summarize"} onClick={() => run("summarize")} />
        <AgentButton label="Detect intent" testid="agent-intent" disabled={!aiConfigured} loading={loading === "intent"} onClick={() => run("intent")} />
      </div>

      {error && (
        <div className="mx-4 mb-2 rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
        {result && (
          <>
            <AgentCard title="Suggested reply" testid="agent-suggested-reply">
              <p className="text-xs leading-relaxed text-[#dfe3ec]">{result.suggestedReply}</p>
              <button
                onClick={() => onUseReply(result.suggestedReply)}
                data-testid="agent-use-reply"
                className="mt-2 w-full rounded-md bg-blue-600/90 px-2 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-500"
              >
                Use in composer
              </button>
            </AgentCard>
            <AgentCard title="Summary" testid="agent-summary">
              <p className="text-xs leading-relaxed text-[#b6bccb]">{result.summary}</p>
            </AgentCard>
            <AgentCard title="Intent" testid="agent-intent-result">
              <div className="flex flex-wrap gap-2">
                <Tag label="intent" value={result.intent} />
                <Tag label="next action" value={result.nextAction} />
              </div>
            </AgentCard>
          </>
        )}
        {!result && aiConfigured && (
          <p className="px-1 pt-2 text-xs text-[#6b7280]">
            Run an action above to get an AI-suggested reply, summary, and intent for this thread.
          </p>
        )}
      </div>
    </aside>
  );
}

function AgentButton({
  label,
  testid,
  disabled,
  loading,
  onClick,
}: {
  label: string;
  testid: string;
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      data-testid={testid}
      className="rounded-lg border border-border bg-bg-raised px-2.5 py-2 text-xs font-medium text-[#c8cdd8] transition enabled:hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "…" : label}
    </button>
  );
}

function AgentCard({
  title,
  testid,
  children,
}: {
  title: string;
  testid?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-bg-panel p-3" data-testid={testid}>
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#6b7280]">
        {title}
      </div>
      {children}
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-white/5 px-2 py-1 text-[11px] text-[#c8cdd8] ring-1 ring-white/10">
      <span className="text-[#6b7280]">{label}:</span> {value}
    </span>
  );
}
