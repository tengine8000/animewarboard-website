"use client";

import { useEffect } from "react";
import { awardDailyLoginAction } from "@/app/actions/points";

export function DailyLoginTracker() {
  useEffect(() => {
    awardDailyLoginAction().then((result) => {
      if (result.awarded) {
        window.dispatchEvent(new CustomEvent("awb:pointaward", { detail: result }));
      }
    }).catch(() => {});
  }, []);
  return null;
}
