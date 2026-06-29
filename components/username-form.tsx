"use client";

import { useState, useTransition } from "react";
import { updateUsernameAction } from "@/app/actions/update-username";
import { AtSign } from "lucide-react";

type Props = {
  current: string;
  cooldownDays: number;
  changedAt: Date | null;
};

export function UsernameForm({ current, cooldownDays, changedAt }: Props) {
  const [value, setValue]     = useState(current);
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTrans] = useTransition();

  const daysLeft = (() => {
    if (!changedAt) return 0;
    const ms = cooldownDays * 24 * 60 * 60 * 1000 - (Date.now() - new Date(changedAt).getTime());
    return ms > 0 ? Math.ceil(ms / (24 * 60 * 60 * 1000)) : 0;
  })();

  const locked = daysLeft > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (locked || value === current) return;
    startTrans(async () => {
      const res = await updateUsernameAction(value);
      if (res.ok) {
        setMsg({ ok: true, text: `Username updated to @${res.username}` });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid var(--color-border)" }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
          Username
        </p>
        {locked && (
          <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
            Next change in {daysLeft} day{daysLeft === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-text-ghost)" }} />
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value.toLowerCase()); setMsg(null); }}
            disabled={locked || pending}
            maxLength={20}
            placeholder="your_username"
            className="w-full pl-8 pr-3 py-2 text-sm font-mono outline-none disabled:opacity-50"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-base)",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={locked || pending || value === current || value.length < 3}
          className="text-[10px] font-black tracking-widest uppercase px-3 py-2 transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>

      <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
        3–20 chars · lowercase letters, numbers, underscores · can change every {cooldownDays} days
      </p>

      {msg && (
        <p className="text-xs font-semibold" style={{ color: msg.ok ? "#4ade80" : "#f87171" }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
