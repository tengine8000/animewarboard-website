"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

type Props = {
  url: string;
  label?: string;
  copiedLabel?: string;
  style?: React.CSSProperties;
};

export function ShareCopyButton({ url, label = "Copy Link", copiedLabel = "Copied!", style }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors"
      style={style ?? { background: "var(--color-surface)", color: "var(--color-text-base)", border: "1px solid var(--color-border)" }}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? copiedLabel : label}
    </button>
  );
}
