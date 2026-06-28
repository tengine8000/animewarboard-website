"use client";

import { useRef, useEffect } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";

export function ShareCaptureCard({
  children,
  filename = "my-prediction.png",
}: {
  children: React.ReactNode;
  filename?: string;
}) {
  const captureRef = useRef<HTMLDivElement>(null);

  async function download() {
    if (!captureRef.current) return;
    const png = await toPng(captureRef.current, { pixelRatio: 2, cacheBust: true });
    const a = document.createElement("a");
    a.download = filename;
    a.href = png;
    a.click();
  }

  useEffect(() => {
    const handler = () => { void download(); };
    window.addEventListener("awb:download-image", handler);
    return () => window.removeEventListener("awb:download-image", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-3">
      <div ref={captureRef}>
        {children}
      </div>
      <button
        onClick={() => void download()}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-colors hover:opacity-80"
        style={{ background: "var(--color-surface)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
      >
        <Download size={13} />
        Save as image
      </button>
    </div>
  );
}
