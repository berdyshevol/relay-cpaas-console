"use client";

import { useState } from "react";
import type { PublicSettings } from "@/lib/settings";

export function SettingsModal({
  settings,
  onClose,
  onSaved,
}: {
  settings: PublicSettings;
  onClose: () => void;
  onSaved: (s: PublicSettings) => void;
}) {
  const [mode, setMode] = useState(settings.mode);
  const [aiProvider, setAiProvider] = useState<string>(settings.aiProvider ?? "");
  const [aiKey, setAiKey] = useState("");
  const [aiModel, setAiModel] = useState(settings.aiModel ?? "");
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioFrom, setTwilioFrom] = useState(settings.twilioFrom ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { mode };
      if (aiProvider) payload.aiProvider = aiProvider;
      if (aiKey) payload.aiKey = aiKey;
      if (aiModel) payload.aiModel = aiModel;
      if (twilioSid) payload.twilioAccountSid = twilioSid;
      if (twilioToken) payload.twilioAuthToken = twilioToken;
      if (twilioFrom) payload.twilioFrom = twilioFrom;
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      onSaved(data.settings);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const useMock = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProvider: "mock" }),
      });
      const data = await res.json();
      onSaved(data.settings);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const clearAll = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true }),
      });
      const data = await res.json();
      onSaved(data.settings);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      data-testid="settings-modal"
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-bg-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Settings</h2>
          <button
            onClick={onClose}
            data-testid="settings-close"
            className="rounded-md px-2 py-1 text-sm text-[#8b93a3] hover:bg-white/5"
          >
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-[#8b93a3]">
          Everything here is optional — the demo runs fully in simulator mode with no
          credentials. Secrets are stored only in your own encrypted, HttpOnly cookie and
          read server-side per request. The host&apos;s keys are never used.
        </p>

        {/* MODE */}
        <Section title="Delivery mode">
          <div className="flex gap-2">
            {(["simulator", "live"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                data-testid={`mode-${m}`}
                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition ${
                  mode === m
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-200"
                    : "border-border bg-bg-raised text-[#8b93a3] hover:bg-bg-hover"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[11px] text-[#6b7280]">
            Live mode sends through Twilio using your BYOK credentials below.
          </p>
        </Section>

        {/* AI BYOK */}
        <Section title="AI agent (BYOK)">
          <label className="mb-1 block text-[11px] text-[#8b93a3]">Provider</label>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value)}
            data-testid="ai-provider"
            className="mb-2 w-full rounded-lg border border-border bg-bg-raised px-3 py-2 text-xs text-[#e6e8ee] focus:border-blue-500/50 focus:outline-none"
          >
            <option value="">None (AI disabled)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="mock">Mock (deterministic, no key)</option>
          </select>
          {aiProvider && aiProvider !== "mock" && (
            <>
              <Input
                label="API key"
                value={aiKey}
                onChange={setAiKey}
                placeholder="sk-…"
                type="password"
                testid="ai-key"
              />
              <Input
                label="Model (optional)"
                value={aiModel}
                onChange={setAiModel}
                placeholder={aiProvider === "openai" ? "gpt-4o-mini" : "claude-3-5-haiku-latest"}
                testid="ai-model"
              />
            </>
          )}
          <button
            onClick={useMock}
            data-testid="use-mock"
            className="mt-1 w-full rounded-lg border border-border bg-bg-raised px-3 py-2 text-xs font-medium text-[#c8cdd8] hover:bg-bg-hover"
          >
            Use deterministic mock agent (no key)
          </button>
        </Section>

        {/* TWILIO BYOK */}
        <Section title="Twilio credentials (live mode)">
          <Input label="Account SID" value={twilioSid} onChange={setTwilioSid} placeholder="AC…" testid="twilio-sid" />
          <Input label="Auth Token" value={twilioToken} onChange={setTwilioToken} placeholder="••••" type="password" testid="twilio-token" />
          <Input label="From number" value={twilioFrom} onChange={setTwilioFrom} placeholder="+1…" testid="twilio-from" />
          <p className="mt-1 text-[11px] text-[#6b7280]">
            Never required for the demo. Used only when delivery mode is &quot;live&quot;.
          </p>
        </Section>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={clearAll}
            data-testid="settings-clear"
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-[#8b93a3] hover:bg-white/5"
          >
            Clear all
          </button>
          <button
            onClick={save}
            disabled={saving}
            data-testid="settings-save"
            className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <h3 className="mb-2 text-xs font-semibold text-[#c8cdd8]">{title}</h3>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  testid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  testid?: string;
}) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-[11px] text-[#8b93a3]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        data-testid={testid}
        className="w-full rounded-lg border border-border bg-bg-raised px-3 py-2 text-xs text-[#e6e8ee] placeholder:text-[#5b6373] focus:border-blue-500/50 focus:outline-none"
      />
    </label>
  );
}
