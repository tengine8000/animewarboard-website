"use client";

import { useState, useTransition } from "react";
import { updateDisplayNameAction } from "@/app/actions/update-display-name";
import { User } from "lucide-react";

type Props = { current: string };

export function DisplayNameForm({ current }: Props) {
  const [value, setValue]     = useState(current);
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTrans] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (trimmed === current || trimmed.length < 2) return;
    startTrans(async () => {
      const res = await updateDisplayNameAction(trimmed);
      if (res.ok) {
        setValue(res.name);
        setMsg({ ok: true, text: "Display name updated." });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <p className="text-[10px] font-black tracking-widest uppercase" style={{ color: "var(--color-text-ghost)" }}>
        Display Name
      </p>

      <form onSubmit={submit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-text-ghost)" }} />
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setMsg(null); }}
            disabled={pending}
            maxLength={50}
            placeholder="Your display name"
            className="w-full pl-8 pr-3 py-2 text-sm outline-none disabled:opacity-50"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-base)",
            }}
          />
        </div>
        <button
          type="submit"
          disabled={pending || value.trim() === current || value.trim().length < 2}
          className="text-[10px] font-black tracking-widest uppercase px-3 py-2 transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </form>

      <p className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
        2–50 characters · shown on your profile and battle cards
      </p>

      {msg && (
        <p className="text-xs font-semibold" style={{ color: msg.ok ? "#4ade80" : "#f87171" }}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
