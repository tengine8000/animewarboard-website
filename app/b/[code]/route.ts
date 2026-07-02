export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getMatchupByCode } from "@/lib/battle-code";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const row = await getMatchupByCode(code);
  if (!row) {
    return NextResponse.redirect(new URL("/battles", _req.url));
  }
  return NextResponse.redirect(new URL(`/battles/${row.slug}`, _req.url), 301);
}
