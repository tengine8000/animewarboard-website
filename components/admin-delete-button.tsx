"use client";

import { Trash2 } from "lucide-react";

export function AdminDeleteButton({
  action,
  label,
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(`Delete "${label}"? This cannot be undone.`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:text-red-400"
        style={{ color: "var(--color-text-muted)" }}
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </form>
  );
}
