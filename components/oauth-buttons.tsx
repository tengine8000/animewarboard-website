import { signIn } from "@/auth";

const PROVIDERS = [
  { label: "Google",  id: "google"  },
  { label: "Discord", id: "discord" },
];

const btnStyle = [
  "flex items-center justify-center py-2 rounded-xl border border-[var(--color-border)]",
  "text-sm font-semibold text-[var(--color-text-muted)]",
  "hover:border-[var(--color-accent)] hover:text-[var(--color-text-base)] transition-colors",
  "w-full cursor-pointer bg-transparent",
].join(" ");

export function OAuthButtons({ returnTo }: { returnTo?: string }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PROVIDERS.map(({ label, id }) => (
        <form key={id} action={async () => {
          "use server";
          await signIn(id, { redirectTo: returnTo ?? "/" });
        }}>
          <button type="submit" className={btnStyle}>{label}</button>
        </form>
      ))}
    </div>
  );
}
