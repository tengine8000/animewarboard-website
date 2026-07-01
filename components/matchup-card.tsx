import Link from "next/link";
import type { MatchupCard } from "@/lib/queries";
import { computeVoteSummary } from "@/lib/queries";
import { PortraitCarousel } from "./portrait-carousel";

const COLOR_A = "var(--color-side-a)";
const COLOR_B = "var(--color-side-b)";

function VSBolt() {
  return (
    <div style={{
      position: "relative", flexShrink: 0,
      width: 44, height: 56,
      display: "flex", alignItems: "center", justifyContent: "center",
      alignSelf: "center",
    }}>
      <span style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 58, lineHeight: 1,
        background: "linear-gradient(160deg, var(--color-side-a) 20%, var(--color-side-b) 80%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        opacity: 0.9,
        filter: "drop-shadow(0 0 10px rgba(248,113,113,0.75)) drop-shadow(0 0 20px rgba(96,165,250,0.55))",
        zIndex: 0,
      }}>⚡</span>
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "flex-end",
        fontStyle: "italic", fontWeight: 900, lineHeight: 1,
        userSelect: "none",
      }}>
        <span style={{ fontSize: 22, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.57), 0 0 20px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.24), 0 2px 8px rgba(0,0,0,0.9)" }}>V</span>
        <span style={{ position: "relative", top: 6, right: 6, fontSize: 22, color: "#fff", textShadow: "0 0 10px rgba(255,255,255,0.57), 0 0 20px rgba(255,255,255,0.42), 0 0 30px rgba(255,255,255,0.24), 0 2px 8px rgba(0,0,0,0.9)", marginBottom: 1 }}>S</span>
      </div>
    </div>
  );
}

export function MatchupCard({ matchup }: { matchup: MatchupCard }) {
  const { slug, sideA, sideB, votes } = matchup;
  const summary = computeVoteSummary(votes.aVotes, votes.bVotes, votes.drawVotes);

  // Map to plain serialisable props — keeps ioredis out of the client bundle
  const toFighters = (ps: MatchupCard["sideA"]) =>
    ps.map((p) => ({
      slug:     p.entity.slug,
      name:     p.entity.name,
      series:   p.series.name,
      imageUrl: p.variant.imageUrl ?? p.entity.imageUrl,
    }));

  return (
    <Link
      href={`/battles/${slug}`}
      style={{
        display: "block",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        overflow: "hidden",
        textDecoration: "none",
        transition: "border-color 0.15s",
      }}
      className="hover:border-[var(--color-accent)]"
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 10px 10px" }}>
        <PortraitCarousel fighters={toFighters(sideA)} side="a" />
        <VSBolt />
        <PortraitCarousel fighters={toFighters(sideB)} side="b" />
      </div>

      {/* Vote bar */}
      <div style={{ height: 3, display: "flex", background: "var(--color-border)" }}>
        {votes.total > 0 && (
          <>
            <div style={{ width: `${summary.aPercent}%`, background: COLOR_A, transition: "width 0.4s" }} />
            {summary.drawPercent > 0 && (
              <div style={{ width: `${summary.drawPercent}%`, background: "var(--color-text-ghost)" }} />
            )}
            <div style={{ flex: 1, background: COLOR_B }} />
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 12px 9px",
      }}>
        <span style={{ fontSize: 9, color: "var(--color-text-ghost)" }}>
          {votes.total === 0
            ? "No predictions yet"
            : `${summary.aPercent}% · ${summary.bPercent}%`}
        </span>
        {summary.settled && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#10b981", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Settled
          </span>
        )}
        {summary.contested && (
          <span style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Contested
          </span>
        )}
        {votes.total > 0 && !summary.settled && !summary.contested && (
          <span style={{ fontSize: 9, color: "var(--color-text-ghost)" }}>
            {votes.total.toLocaleString()} picks
          </span>
        )}
      </div>
    </Link>
  );
}
