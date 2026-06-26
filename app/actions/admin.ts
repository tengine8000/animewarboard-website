"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { adminSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateAdminSettingAction(
  key: string,
  value: number,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if ((session?.user as any)?.role !== "admin") return { ok: false, error: "unauthorized" };

  if (!Number.isInteger(value) || value < 0) return { ok: false, error: "invalid_value" };

  await db
    .update(adminSettings)
    .set({ value, updatedBy: session!.user!.id, updatedAt: new Date() })
    .where(eq(adminSettings.key, key));

  revalidatePath("/admin/settings");
  return { ok: true };
}
