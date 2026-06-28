"use client";

export function TikTokDownloadButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new CustomEvent("awb:download-image"))}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:opacity-80"
      style={{ background: "#000", color: "#fff", border: "1px solid #333" }}
    >
      ↓ Save for TikTok
    </button>
  );
}
