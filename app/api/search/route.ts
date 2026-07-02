import { NextRequest, NextResponse } from "next/server";
import { searchEntities, searchCategories } from "@/lib/queries";
import { getMatchupByCode } from "@/lib/battle-code";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ entities: [], series: [], battle: null });

  // If query looks like a battle code (AWB-XXXXXXX or just XXXXXXX), try code lookup first
  const isCodeQuery = /^(awb-)?[0-9a-z]{4,8}$/i.test(q.trim());
  const [foundEntities, foundSeries, battle] = await Promise.all([
    searchEntities(q, 8),
    searchCategories(q, 4),
    isCodeQuery ? getMatchupByCode(q.trim()) : Promise.resolve(null),
  ]);

  return NextResponse.json({ entities: foundEntities, series: foundSeries, battle });
}
