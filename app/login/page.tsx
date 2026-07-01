import type { Metadata } from "next";
import { OAuthButtons } from "@/components/oauth-buttons";
import { LogoMark } from "@/components/logo-mark";

export const metadata: Metadata = { title: "Sign In" };

type Props = { searchParams: Promise<{ returnTo?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { returnTo, error } = await searchParams;

  const ERROR_MESSAGES: Record<string, string> = {
    Configuration:          "OAuth provider is not configured correctly.",
    OAuthSignin:            "Could not start the sign-in flow. Please try again.",
    OAuthCallback:          "OAuth sign-in failed. Please try again.",
    OAuthAccountNotLinked:  "This email is already registered with a different sign-in method.",
    Default:                "Something went wrong. Please try again.",
  };
  const oauthError = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : null;

  return (
    <div className="flex flex-col items-center justify-start sm:justify-center px-4 pt-10 pb-16 sm:min-h-[80vh]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <LogoMark size={52} />
          </div>
          <h1 className="text-2xl font-black tracking-tight">Welcome back</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Sign in to submit predictions and earn rank.
          </p>
        </div>

        {oauthError && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5 text-center">
            {oauthError}
          </p>
        )}

        <OAuthButtons returnTo={returnTo} />
      </div>
    </div>
  );
}
