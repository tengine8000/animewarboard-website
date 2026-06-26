"use client";

import { useState, useEffect } from "react";
import { RadarChart } from "@/components/radar-chart";
import type { RadarStat } from "@/lib/queries";

type Props = {
  defaultStatsA:     RadarStat[];
  defaultStatsB:     RadarStat[];
  communityStats?:   RadarStat[];
  size?: number;
};

export function DynamicRadarChart({ defaultStatsA, defaultStatsB, communityStats = [], size = 200 }: Props) {
  const [statsA, setStatsA] = useState<RadarStat[]>(defaultStatsA);
  const [statsB, setStatsB] = useState<RadarStat[]>(defaultStatsB);

  useEffect(() => {
    const handler = (e: Event) => {
      const { statsA: a, statsB: b } = (e as CustomEvent).detail;
      setStatsA(a);
      setStatsB(b);
    };
    window.addEventListener("battleformchange", handler);
    return () => window.removeEventListener("battleformchange", handler);
  }, []);

  return <RadarChart statsA={statsA} statsB={statsB} statsC={communityStats} size={size} />;
}
