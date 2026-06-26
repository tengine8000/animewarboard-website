"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getNotifications, type NotificationRow } from "@/lib/queries";

export async function getNotificationsAction(): Promise<NotificationRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  return getNotifications(session.user.id, 30);
}

export async function markAllReadAction(): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false };

  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, session.user.id), eq(notifications.read, false)));

  return { ok: true };
}
