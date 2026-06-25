import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { trackEvent } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const jar = await cookies();
    const sessionId = jar.get("awb_sid")?.value ?? "unknown";
    const session = await auth();
    const { path, referrer, metadata } = await req.json();

    await trackEvent({
      sessionId,
      userId:    session?.user?.id ?? null,
      eventType: "page_view",
      path,
      referrer,
      metadata,
    });
  } catch { /* never block the page */ }
  return NextResponse.json({ ok: true });
}
