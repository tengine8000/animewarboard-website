import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — AnimeWarBoard",
  description: "Learn how AnimeWarBoard collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/" className="text-sm hover:underline mb-8 inline-block"
        style={{ color: "var(--color-text-muted)" }}>
        ← Back
      </Link>

      <h1 className="text-4xl font-black tracking-tight mb-3"
        style={{ color: "var(--color-text-base)" }}>
        Privacy Policy
      </h1>
      <p className="mb-12 text-sm" style={{ color: "var(--color-text-ghost)" }}>
        Last updated: July 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            1. Who We Are
          </h2>
          <p>
            AnimeWarBoard (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is a
            community platform for anime power-scaling debates and battle predictions, operated
            by <a href="https://nimblesoftlimited.com" className="underline underline-offset-2" style={{ color: "var(--color-accent)" }}>Nimblesoftlimited</a>.
            Users vote on matchups, submit characters, post comments, and earn ranks based on
            their participation.
          </p>
          <p>
            If you have questions about this policy, contact us at{" "}
            <a href="mailto:torty.emmanuel@nimblesoftlimited.com" className="underline underline-offset-2"
              style={{ color: "var(--color-accent)" }}>
              torty.emmanuel@nimblesoftlimited.com
            </a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            2. Information We Collect
          </h2>
          <p>We collect information you provide directly when you sign in via a social provider, including:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Your name and profile picture (from the OAuth provider you choose)</li>
            <li>Your email address (used only for account management, never shared)</li>
            <li>Any username, bio, or avatar you set on your profile</li>
          </ul>
          <p>We also collect information automatically when you use the platform:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>IP address and browser/device type for rate limiting and security</li>
            <li>Usage logs (votes cast, comments posted, pages visited)</li>
            <li>Session tokens stored in cookies required for authentication</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            3. How We Use Your Information
          </h2>
          <p>We use collected information to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Create and manage your account</li>
            <li>Track your votes, predictions, XP, and rank progression</li>
            <li>Display your username and rank on public leaderboards and battle pages</li>
            <li>Detect and prevent abuse, vote manipulation, and spam</li>
            <li>Respond to support requests</li>
          </ul>
          <p>We do not send marketing emails. We have no advertising on the platform.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            4. User-Generated Content
          </h2>
          <p>
            Votes, comments, battle predictions, and character submissions you post are
            associated with your account. This content may be visible to other users on the
            platform. If you delete your account, your votes and comments are removed, but
            characters or battles you submitted are kept in an unattributed state so existing
            community data is not broken.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            5. Data Retention
          </h2>
          <p>
            Account data is retained for as long as your account is active. You may request
            account deletion at any time by contacting us. Upon deletion, your account,
            email, votes, comments, and point history are permanently removed.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            6. Sharing Your Information
          </h2>
          <p>
            We do not sell your personal data. We share data only with the service providers
            necessary to operate AnimeWarBoard:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong style={{ color: "var(--color-text-base)" }}>Google, Discord, Reddit, X (Twitter), Facebook</strong> — OAuth login providers</li>
            <li><strong style={{ color: "var(--color-text-base)" }}>Our VPS host</strong> — database and server infrastructure</li>
          </ul>
          <p>
            Each OAuth provider is subject to their own privacy policies. We may also
            disclose data when required by law.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            7. Cookies
          </h2>
          <p>
            We use essential cookies only — to maintain your authenticated session and
            remember your preferences. We do not use tracking cookies or third-party
            advertising cookies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            8. Your Rights
          </h2>
          <p>
            Depending on your jurisdiction, you may have the right to access, correct,
            export, or delete your personal data. To exercise any of these rights, contact
            us at{" "}
            <a href="mailto:torty.emmanuel@nimblesoftlimited.com" className="underline underline-offset-2"
              style={{ color: "var(--color-accent)" }}>
              torty.emmanuel@nimblesoftlimited.com
            </a>. We will respond within 30 days.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            9. Security
          </h2>
          <p>
            We use HTTPS everywhere, secure session cookies, and encrypted database
            connections. We never store passwords — authentication is handled entirely
            by your chosen OAuth provider. No system is 100% secure; we encourage you
            to keep your linked social accounts secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            10. Children
          </h2>
          <p>
            AnimeWarBoard is not directed to children under 13. We do not knowingly
            collect data from children. If you believe a child has created an account,
            contact us for immediate removal.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-black" style={{ color: "var(--color-text-base)" }}>
            11. Changes to This Policy
          </h2>
          <p>
            We may update this policy from time to time. When we do, we will update the
            &ldquo;Last updated&rdquo; date at the top. For material changes, we will
            post a notice on the site.
          </p>
        </section>

      </div>
    </main>
  );
}
