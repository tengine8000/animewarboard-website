"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export type AuthState = { error: string } | null;

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) return { error: "Email and password are required." };

  const returnTo = (formData.get("returnTo") as string | null)?.trim() || "/";
  const safeRedirect = returnTo.startsWith("/") ? returnTo : "/";

  try {
    await signIn("credentials", { email, password, redirectTo: safeRedirect });
  } catch (err) {
    if (err instanceof AuthError) return { error: "Invalid email or password." };
    throw err;
  }
  return null;
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name     = (formData.get("name")     as string)?.trim();
  const email    = (formData.get("email")    as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!name || !email || !password) return { error: "All fields are required." };
  if (name.length < 2)              return { error: "Display name must be at least 2 characters." };
  if (password.length < 8)          return { error: "Password must be at least 8 characters." };
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return { error: "Enter a valid email address." };

  const [existing] = await db.select({ id: users.id })
    .from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    name,
    email,
    passwordHash,
    emailVerified: new Date(), // auto-verify credentials signups
    role: "user",
  });

  const returnTo = (formData.get("returnTo") as string | null)?.trim() || "/";
  const safeRedirect = returnTo.startsWith("/") ? returnTo : "/";

  try {
    await signIn("credentials", { email, password, redirectTo: safeRedirect });
  } catch (err) {
    if (err instanceof AuthError)
      return { error: "Account created — please sign in." };
    throw err;
  }
  return null;
}
