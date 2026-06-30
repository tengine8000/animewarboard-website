"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateAvatarAction(fd: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const imageUrl = (fd.get("imageUrl") as string | null)?.trim();
  if (!imageUrl) return;

  await db.update(users).set({ image: imageUrl }).where(eq(users.id, session.user.id));
  revalidatePath("/profile");
}
