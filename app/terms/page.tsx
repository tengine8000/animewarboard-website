import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — AnimeWarBoard",
  description: "Read the terms and conditions governing your use of AnimeWarBoard.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm hover:underline mb-8 inline-block"
        style={{ color: "var(--color-text-muted)" }}>
        ← Back
      </Link>

      <h1 className="text-4xl font-black tracking-tight mb-3"
        style={{ color: "var(--color-text-base)" }}>
        Terms of Service
      </h1>
      <p className="mb-12 text-sm" style={{ color: "var(--color-text-ghost)" }}>
        Last updated: July 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            1. Acceptance of Terms
          </h2>
          <p>
            By creating an account or using AnimeWarBoard (&ldquo;the Platform&rdquo;), you
            agree to these Terms of Service. If you do not agree, do not use the Platform.
            These terms apply to all users.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            2. The Platform
          </h2>
          <p>
            AnimeWarBoard is a free community platform for anime power-scaling debates,
            operated by <a href="https://nimblesoftlimited.com" className="underline underline-offset-2" style={{ color: "var(--color-accent)" }}>Nimblesoftlimited</a>.
            Users can vote on character matchups, submit characters, post comments, and
            earn XP and ranks based on participation. The Platform is provided on an
            &ldquo;as-is&rdquo; basis — we strive for high availability but do not
            guarantee uninterrupted service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            3. Accounts
          </h2>
          <p>
            You must sign in via a supported OAuth provider (Google, Discord, Reddit, X,
            or Facebook). You are responsible for the security of your linked social account
            and for all activity that occurs under your AnimeWarBoard account.
          </p>
          <p>
            One account per person. Creating multiple accounts to manipulate votes,
            leaderboards, or any other platform metric is prohibited and will result in
            permanent bans for all associated accounts.
          </p>
          <p>
            Notify us immediately of any unauthorized access at{" "}
            <a href="mailto:torty.emmanuel@nimblesoftlimited.com" className="underline underline-offset-2"
              style={{ color: "var(--color-accent)" }}>
              torty.emmanuel@nimblesoftlimited.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            4. Account Deletion
          </h2>
          <p>
            You may request account deletion by contacting us. Upon deletion, your account,
            votes, comments, XP, and point history are permanently removed. Characters or
            battles you submitted are retained in an unattributed state to preserve
            community data integrity. This is irreversible.
          </p>
          <p>
            We reserve the right to immediately delete accounts that violate these Terms,
            without notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            5. User Content
          </h2>
          <p>
            You retain ownership of content you submit (comments, character descriptions,
            battle write-ups). By submitting content, you grant AnimeWarBoard a worldwide,
            royalty-free license to display and distribute that content on the Platform.
          </p>
          <p>
            You are solely responsible for the content you post. Do not submit content that
            is defamatory, infringing, obscene, or violates any third-party rights. We
            reserve the right to remove any content at our discretion.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            6. Acceptable Use
          </h2>
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Manipulate votes, XP, or leaderboards through bots, scripts, or multiple accounts</li>
            <li>Harass, threaten, or abuse other users</li>
            <li>Attempt to reverse-engineer, scrape, or exploit the Platform</li>
            <li>Submit false, misleading, or copyrighted character/anime information without authorization</li>
            <li>Use the Platform for any unlawful purpose</li>
          </ul>
          <p>
            Violations may result in immediate account suspension or permanent ban.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            7. XP, Ranks, and Points
          </h2>
          <p>
            XP, ranks, and points are virtual rewards with no monetary value and are not
            redeemable for cash or prizes. We reserve the right to adjust, reset, or
            modify XP and rank systems at any time, with or without notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            8. Data and Privacy
          </h2>
          <p>
            Your use of the Platform is governed by our{" "}
            <Link href="/privacy" className="underline underline-offset-2"
              style={{ color: "var(--color-accent)" }}>
              Privacy Policy
            </Link>
            , incorporated into these terms by reference.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            9. Intellectual Property
          </h2>
          <p>
            AnimeWarBoard&rsquo;s platform code, design, and original content are owned by
            us. Character names, series names, and images belong to their respective
            copyright holders. We host community-submitted reference data for fan discussion
            purposes under fair use. If you believe your copyright is being infringed,
            contact us at{" "}
            <a href="mailto:torty.emmanuel@nimblesoftlimited.com" className="underline underline-offset-2"
              style={{ color: "var(--color-accent)" }}>
              torty.emmanuel@nimblesoftlimited.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            10. Disclaimers and Limitation of Liability
          </h2>
          <p>
            The Platform is provided &ldquo;as is&rdquo; without warranties of any kind.
            All battle outcomes, power rankings, and stat scores are community opinions —
            not official canon. We are not liable for any loss or damage arising from your
            use of or inability to use the Platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            11. Changes to These Terms
          </h2>
          <p>
            We may update these terms from time to time. Continued use of the Platform
            after changes constitutes acceptance. For material changes, we will post a
            notice on the site with at least 7 days notice.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            12. Contact
          </h2>
          <p>
            For questions about these terms, contact us at{" "}
            <a href="mailto:torty.emmanuel@nimblesoftlimited.com" className="underline underline-offset-2"
              style={{ color: "var(--color-accent)" }}>
              torty.emmanuel@nimblesoftlimited.com
            </a>.
          </p>
        </section>

      </div>
    </main>
  );
}
