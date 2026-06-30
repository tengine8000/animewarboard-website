import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";
import { OAuthButtons } from "@/components/oauth-buttons";

export const metadata: Metadata = { title: "Join AnimeWarBoard" };

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return (
    <div className="flex flex-col items-center justify-start sm:justify-center px-4 pt-10 pb-16 sm:min-h-[80vh]">
      <RegisterForm returnTo={returnTo} oauthButtons={<OAuthButtons returnTo={returnTo} />} />
    </div>
  );
}
