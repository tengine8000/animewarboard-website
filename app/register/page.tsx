import type { Metadata } from "next";
import { RegisterForm } from "@/components/register-form";

export const metadata: Metadata = { title: "Join AnimeWarBoard" };

type Props = { searchParams: Promise<{ returnTo?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { returnTo } = await searchParams;
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <RegisterForm returnTo={returnTo} />
    </div>
  );
}
