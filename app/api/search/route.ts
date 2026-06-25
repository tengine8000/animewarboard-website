import { NextRequest, NextResponse } from "next/server";
import { searchEntities, searchCategories } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.length < 2) return NextResponse.json({ entities: [], series: [] });

  const [foundEntities, foundSeries] = await Promise.all([
    searchEntities(q, 8),
    searchCategories(q, 4),
  ]);

  return NextResponse.json({ entities: foundEntities, series: foundSeries });
}
