"use client";

import { useState, useTransition } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  approveAction: () => Promise<void>;
  rejectAction:  () => Promise<void>;
  label: string;
}

export function AdminReviewButtons({ approveAction, rejectAction, label }: Props) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => { await approveAction(); });
  }

  function reject() {
    if (!confirmReject) { setConfirmReject(true); return; }
    startTransition(async () => { await rejectAction(); setConfirmReject(false); });
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={approve}
        disabled={pending}
        title={`Approve ${label}`}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-opacity disabled:opacity-50"
        style={{ background: "color-mix(in srgb, #22c55e 14%, transparent)", color: "#22c55e", border: "1px solid #22c55e40" }}
      >
        <CheckCircle size={12} /> Approve
      </button>

      <button
        onClick={reject}
        disabled={pending}
        title={confirmReject ? `Click again to confirm rejection of ${label}` : `Reject ${label}`}
        className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg transition-opacity disabled:opacity-50"
        style={{
          background: confirmReject ? "color-mix(in srgb, #ef4444 22%, transparent)" : "color-mix(in srgb, #ef4444 10%, transparent)",
          color: "#ef4444",
          border: "1px solid #ef444440",
        }}
        onBlur={() => setConfirmReject(false)}
      >
        <XCircle size={12} /> {confirmReject ? "Confirm reject?" : "Reject"}
      </button>
    </div>
  );
}
