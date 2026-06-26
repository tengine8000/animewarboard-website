import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign In" };

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
