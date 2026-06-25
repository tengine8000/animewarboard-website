"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function PageViewTracker() {
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const lastPath    = useRef<string | null>(null);

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    if (lastPath.current === url) return;
    lastPath.current = url;

    const utmMeta: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"]) {
      const val = searchParams.get(key);
      if (val) utmMeta[key] = val;
    }

    fetch("/api/analytics", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        path:     pathname,
        referrer: document.referrer || null,
        metadata: Object.keys(utmMeta).length > 0 ? utmMeta : null,
      }),
    }).catch(() => {});
  }, [pathname, searchParams]);

  return null;
}
