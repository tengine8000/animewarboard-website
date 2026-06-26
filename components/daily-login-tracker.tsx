"use client";

import { useEffect } from "react";
import { awardDailyLoginAction } from "@/app/actions/points";

export function DailyLoginTracker() {
  useEffect(() => {
    awardDailyLoginAction().catch(() => {});
  }, []);
  return null;
}
