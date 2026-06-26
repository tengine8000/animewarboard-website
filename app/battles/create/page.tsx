import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CreateMatchupForm } from "@/components/create-matchup-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Battle" };

export default async function CreateBattlePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?returnTo=/battles/create");

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black">Create a Battle</h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Pick a character for each side. The community will decide who wins.
        </p>
      </div>
      <CreateMatchupForm />
    </div>
  );
}
