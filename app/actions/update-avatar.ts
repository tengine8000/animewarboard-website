"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function updateAvatarAction(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const imageUrl = (fd.get("imageUrl") as string | null)?.trim();
  if (!imageUrl) return;

  await db.update(users).set({ image: imageUrl }).where(eq(users.id, session.user.id));
  // No revalidatePath — the client calls router.refresh() after state commits
  // so the new image is visible immediately with no RSC re-render race condition.
}
