import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Sign In" };

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return (
    <div className="flex flex-col items-center justify-start sm:justify-center px-4 pt-10 pb-16 sm:min-h-[80vh]">
      <LoginForm returnTo={returnTo} />
    </div>
  );
}
