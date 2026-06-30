import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";
import { OAuthButtons } from "@/components/oauth-buttons";

export const metadata: Metadata = { title: "Sign In" };

type Props = { searchParams: Promise<{ returnTo?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { returnTo, error } = await searchParams;
  return (
    <div className="flex flex-col items-center justify-start sm:justify-center px-4 pt-10 pb-16 sm:min-h-[80vh]">
      <div className="w-full max-w-sm space-y-6">
        <LoginForm returnTo={returnTo} urlError={error} />
        <OAuthButtons returnTo={returnTo} />
      </div>
    </div>
  );
}
