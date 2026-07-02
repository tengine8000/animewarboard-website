"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { Swords, Handshake, RotateCcw, CheckCircle, Info, Share2 } from "lucide-react";
import { submitVoteAction } from "@/app/actions/vote";
import type { VotePayload } from "@/app/actions/vote";

type Verdict    = "a" | "b" | "draw";
type Difficulty = "very_easy" | "easy" | "medium" | "hard" | "extreme";
type ExistingVote = { id: string; verdict: Verdict; difficulty: Difficulty } | null;

type Props = {
  matchupId:         string;
  matchupSlug:       string;
  labelA:            string;
  labelB:            string;
  imageA:            string | null;
  imageB:            string | null;
  isLoggedIn:        boolean;
  existingVote:      ExistingVote;
  existingStatValues: Record<string, number>;
};

const DIFFICULTIES: { value: Difficulty; num: number; label: string; short: string; tip: string }[] = [
  { value: "very_easy", num: 1, label: "Very Easy", short: "Total stomp",           tip: "One fighter has an overwhelming advantage. No realistic scenario the other wins." },
  { value: "easy",      num: 2, label: "Easy",      short: "Clear win with effort", tip: "The winner is clear but has to put in genuine work to finish the fight." },
  { value: "medium",    num: 3, label: "Medium",    short: "Could go either way",   tip: "Both fighters have real chances. The winner comes down to specifics." },
  { value: "hard",      num: 4, label: "Hard",      short: "Pushed to the limit",   tip: "The winner barely comes out on top. One mistake could flip the outcome." },
  { value: "extreme",   num: 5, label: "Extreme",   short: "Barely scrapes through",tip: "Extremely contested. The loser could have won under different circumstances." },
];

// Order + labels match the reference design
const STATS: { slug: string; emoji: string; label: string; tip: string }[] = [
  { slug: "speed",        emoji: "⚡", label: "SPEED",          tip: "Raw movement speed and reaction time" },
  { slug: "battle-iq",   emoji: "🧠", label: "IQ",             tip: "In-fight intelligence and adaptability" },
  { slug: "strength",     emoji: "💪", label: "STRENGTH",       tip: "Physical striking power and lifting force" },
  { slug: "stamina",      emoji: "❤️", label: "STAMINA",        tip: "How long they can sustain peak performance" },
  { slug: "durability",   emoji: "🛡️", label: "DURABILITY",     tip: "Ability to take damage and keep fighting" },
  { slug: "hax",          emoji: "✨", label: "HAX / ABILITIES", tip: "Broken or hard-to-counter abilities: reality warping, time manipulation, etc." },
  { slug: "range",        emoji: "🎯", label: "RANGE",          tip: "Maximum effective attack distance" },
  { slug: "regeneration", emoji: "✚",  label: "REGEN",          tip: "Speed and extent of healing during battle" },
  { slug: "versatility",  emoji: "🌀", label: "VERSATILITY",    tip: "Breadth of fighting styles and adaptability" },
];

const PENDING_COOKIE = "pending_vote";

function savePendingVote(d: { matchupId: string; matchupSlug: string; verdict: Verdict; difficulty: Difficulty }) {
  document.cookie = `${PENDING_COOKIE}=${encodeURIComponent(JSON.stringify(d))}; path=/; max-age=86400; SameSite=Lax`;
}
function readPendingVote(matchupId: string): { verdict: Verdict; difficulty: Difficulty } | null {
  try {
    const raw = document.cookie.split("; ").find((c) => c.startsWith(`${PENDING_COOKIE}=`))?.split("=").slice(1).join("=");
    if (!raw) return null;
    const p = JSON.parse(decodeURIComponent(raw));
    if (p.matchupId !== matchupId) return null;
    return { verdict: p.verdict, difficulty: p.difficulty };
  } catch { return null; }
}
function clearPendingVote() {
  document.cookie = `${PENDING_COOKIE}=; path=/; max-age=0`;
}

// ── Neon glows ────────────────────────────────────────────────────────────────
const GLOW = {
  a:      "inset 0 0 12px rgba(248,113,113,0.55), inset 0 0 30px rgba(248,113,113,0.25)",
  b:      "inset 0 0 12px rgba(96,165,250,0.55),  inset 0 0 30px rgba(96,165,250,0.25)",
  accent: "inset 0 0 12px rgba(249,115,22,0.55),  inset 0 0 30px rgba(249,115,22,0.25)",
};
// Outer glow used on difficulty nodes (circles, not rectangular buttons)
const GLOW_NODE = "0 0 10px rgba(249,115,22,0.9), 0 0 22px rgba(249,115,22,0.45)";
// Clip-path for the small difficulty description pill
const CLIP_PILL = "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)";

// ── Clipped-corner card ───────────────────────────────────────────────────────
const CLIP = "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)";

function ClipCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ clipPath: CLIP, background: "var(--color-border)", padding: "1px" }}>
      <div style={{ clipPath: CLIP, background: "var(--color-surface)" }}>
        {children}
      </div>
    </div>
  );
}

function CardHeader({ num, label, tip }: { num: number; label: string; tip?: string }) {
  return (
    <div className="px-5 py-3 flex items-center justify-center gap-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <p className="text-[11px] font-black tracking-widest uppercase text-center"
        style={{ color: "var(--color-text-base)", textShadow: "0 0 8px rgba(232,234,246,0.45), 0 0 20px rgba(232,234,246,0.18)" }}>
        {num}. {label}
      </p>
      {tip && (
        <Tip text={tip}>
          <Info size={11} style={{ color: "var(--color-text-ghost)", cursor: "help" }} />
        </Tip>
      )}
    </div>
  );
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-56 px-3 py-2 text-xs shadow-2xl"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-accent)",
          color: "var(--color-text-muted)",
          boxShadow: GLOW.accent,
          clipPath: CLIP,
        }}
      >
        {text}
      </div>
    </div>
  );
}

// ── Verdict button — octagonal, horizontal layout ─────────────────────────────
function VerdictButton({ v, active, onClick }: { v: Verdict; active: boolean; onClick: () => void }) {
  const cfg = {
    a:    { color: "var(--color-side-a)", glow: GLOW.a, icon: <Swords size={30} />,    line1: "RED",  line2: "WINS" },
    b:    { color: "var(--color-side-b)", glow: GLOW.b, icon: <Swords size={30} />,    line1: "BLUE", line2: "WINS" },
    draw: { color: "var(--color-text-dim)", glow: "",   icon: <Handshake size={30} />, line1: "DRAW", line2: ""     },
  }[v];

  return (
    // Outer div = colored border via clip-path background
    <div style={{
      clipPath: CLIP,
      background: active ? cfg.color : "var(--color-border)",
      padding: "1px",
    }}>
      <button
        onClick={onClick}
        className="relative flex items-center justify-center gap-2.5 py-5 px-3 transition-all duration-150 font-black w-full"
        style={{
          clipPath: CLIP,
          background: active
            ? `color-mix(in srgb, ${cfg.color} 10%, var(--color-surface))`
            : "var(--color-surface)",
          color: active ? cfg.color : "var(--color-text-dim)",
          boxShadow: active ? cfg.glow : "none",
        }}
      >
        {active && (
          <div className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: cfg.color }}>
            <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>
          </div>
        )}
        <span style={{ opacity: active ? 1 : 0.35, flexShrink: 0 }}>{cfg.icon}</span>
        <span className="text-[11px] font-black tracking-wide leading-tight text-left">
          {cfg.line1}{cfg.line2 && <><br />{cfg.line2}</>}
        </span>
      </button>
    </div>
  );
}

// ── Difficulty track — numbered nodes on a line (pill rendered by parent) ──────
function DifficultyTrack({ value, onChange }: { value: Difficulty | null; onChange: (d: Difficulty) => void }) {
  const NODE = 44;
  return (
    <div className="px-4 pt-5 pb-5">
      <div className="relative" style={{ height: NODE + 28 }}>
        {/* Connecting line */}
        <div style={{
          position: "absolute", left: "10%", right: "10%", top: NODE / 2,
          height: 2, background: "var(--color-border)", transform: "translateY(-50%)",
        }} />
        <div style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", alignItems: "start" }}>
          {DIFFICULTIES.map((d) => {
            const active = value === d.value;
            return (
              <button key={d.value} onClick={() => onChange(d.value)}
                className="flex flex-col items-center gap-2" style={{ position: "relative", zIndex: 1 }}>
                <div style={{
                  width: NODE, height: NODE, borderRadius: "50%",
                  border: `2px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: active ? "color-mix(in srgb, var(--color-accent) 14%, var(--color-bg))" : "var(--color-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 900, fontSize: 18,
                  color: active ? "var(--color-accent)" : "var(--color-text-muted)",
                  boxShadow: active ? GLOW_NODE : "none",
                  transition: "all 0.2s", flexShrink: 0,
                }}>
                  {d.num}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: active ? 900 : 600, letterSpacing: "0.03em",
                  color: active ? "var(--color-accent)" : "var(--color-text-ghost)",
                  textAlign: "center", lineHeight: 1.2,
                }}>
                  {d.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Stat slider with graduated tick marks ─────────────────────────────────────
function StatSlider({ stat, value, onChange, disabled }: {
  stat: typeof STATS[number]; value: number; onChange: (v: number) => void; disabled: boolean;
}) {
  const gradient = `linear-gradient(to right, var(--color-side-a) 0%, var(--color-side-a) ${value}%, var(--color-side-b) ${value}%, var(--color-side-b) 100%)`;
  const ticks    = `repeating-linear-gradient(to right, rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1.5px, transparent 1.5px, transparent 10%)`;

  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-sm w-5 text-center shrink-0 select-none leading-none">{stat.emoji}</span>
      <div className="flex items-center gap-1 shrink-0" style={{ width: 112 }}>
        <span className="text-[10px] font-black tracking-wide" style={{ color: "var(--color-text-muted)" }}>
          {stat.label}
        </span>
        <Tip text={stat.tip}>
          <Info size={9} style={{ color: "var(--color-text-ghost)", flexShrink: 0 }} />
        </Tip>
      </div>
      {/* Track wrapper — provides visual track + tick marks */}
      <div className="relative flex-1" style={{ height: 20, position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 4, borderRadius: "9999px",
          top: "50%", transform: "translateY(-50%)",
          backgroundImage: `${ticks}, ${gradient}`,
          pointerEvents: "none",
        }} />
        <input
          type="range" min={0} max={100} value={value} disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          className="stat-slider"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", margin: 0, zIndex: 1 }}
        />
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function BattleVoteForm({ matchupId, matchupSlug, labelA, labelB, imageA, imageB, isLoggedIn, existingVote, existingStatValues }: Props) {
  const [verdict,    setVerdict]    = useState<Verdict | null>(existingVote?.verdict ?? null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(existingVote?.difficulty ?? null);
  const defaultStats = Object.fromEntries(STATS.map((s) => [s.slug, existingStatValues[s.slug] ?? 50]));
  const [statValues, setStatValues] = useState<Record<string, number>>(defaultStats);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);
  const [success, setSuccess] = useState(false);
  const [voteId, setVoteId]   = useState<string | null>(existingVote?.id ?? null);
  const [error, setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isLoggedIn && !existingVote) {
      const pending = readPendingVote(matchupId);
      if (pending) { setVerdict(pending.verdict); setDifficulty(pending.difficulty); clearPendingVote(); }
    }
  }, [isLoggedIn, existingVote, matchupId]);

  // Broadcast slider + verdict changes so DynamicRadarChart and PredictionConfidence can react
  useEffect(() => {
    const statsA = STATS.map((s, i) => ({ slug: s.slug, name: s.label, sortOrder: i, value: statValues[s.slug] ?? 50 }));
    const statsB = STATS.map((s, i) => ({ slug: s.slug, name: s.label, sortOrder: i, value: 100 - (statValues[s.slug] ?? 50) }));
    window.dispatchEvent(new CustomEvent("battleformchange", { detail: { statsA, statsB, verdict, statValues } }));
  }, [statValues, verdict]);

  function handleReset() {
    setVerdict(null); setDifficulty(null);
    setStatValues(Object.fromEntries(STATS.map((s) => [s.slug, 50])));
    setShowRegisterPrompt(false); setSuccess(false); setError(null);
  }

  function handleSubmit() {
    if (!verdict || !difficulty) { setError("Pick a verdict and a difficulty first."); return; }
    if (!isLoggedIn) { savePendingVote({ matchupId, matchupSlug, verdict, difficulty }); setShowRegisterPrompt(true); return; }
    setError(null);
    startTransition(async () => {
      const result = await submitVoteAction({ matchupId, matchupSlug, verdict, difficulty, statValues });
      if (result.ok) { setVoteId(result.voteId); setSuccess(true); }
      else setError("Something went wrong. Try again.");
    });
  }

  // ── Success ────────────────────────────────────────────────────────────────
  if (success) {
    return (
      <ClipCard>
        <div className="p-8 text-center space-y-5">
          <div className="space-y-1">
            <CheckCircle size={36} className="mx-auto text-emerald-400" />
            <p className="font-black text-xl">Prediction Locked In!</p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {verdict === "draw" ? "Draw" : verdict === "a" ? labelA : labelB} wins ·{" "}
              {DIFFICULTIES.find((d) => d.value === difficulty)?.label} difficulty
            </p>
          </div>

          {/* Primary CTA — Share */}
          {voteId && (
            <div style={{ filter: "drop-shadow(0 0 2px rgba(249,115,22,0.6)) drop-shadow(0 0 6px rgba(249,115,22,0.35))" }}>
              <Link
                href={`/battles/${matchupSlug}/share/${voteId}`}
                className="flex items-center justify-center gap-2.5 w-full font-black py-4 text-sm tracking-widest uppercase"
                style={{ clipPath: CLIP, background: "var(--color-accent)", color: "#fff" }}
              >
                <Share2 size={16} /> Share My Prediction
              </Link>
            </div>
          )}

          {/* Secondary — Edit */}
          <button
            onClick={() => setSuccess(false)}
            className="text-xs hover:underline"
            style={{ color: "var(--color-text-ghost)" }}
          >
            Edit prediction
          </button>
        </div>
      </ClipCard>
    );
  }

  const isEditMode = !!existingVote && !success;

  return (
    <div className="space-y-3">
      {/* ── 1 + 2. VERDICT & DIFFICULTY — one card, gray divider ────────── */}
      <div style={{ position: "relative" }}>
        <ClipCard>
          <CardHeader num={1} label="How will this battle end?" />
          <div className="p-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(["a", "b", "draw"] as Verdict[]).map((v) => (
              <VerdictButton key={v} v={v} active={verdict === v} onClick={() => setVerdict(v)} />
            ))}
          </div>

          {/* Gray divider between sections */}
          <div style={{ borderTop: "1px solid var(--color-border)" }} />

          <CardHeader num={2} label="How difficult is this battle?"
            tip="Rate how one-sided this matchup is. 1 = total stomp, 5 = could go either way every time." />
          <DifficultyTrack value={difficulty} onChange={setDifficulty} />
        </ClipCard>

        {/* Difficulty description pill — octagonal, overlaps bottom edge */}
        {difficulty && (() => {
          const diffInfo = DIFFICULTIES.find((d) => d.value === difficulty)!;
          return (
            <div style={{ display: "flex", justifyContent: "center", position: "relative", marginTop: "-14px", zIndex: 10 }}>
              <div style={{ clipPath: CLIP_PILL, background: "var(--color-accent)", padding: "1px" }}>
                <div style={{ clipPath: CLIP_PILL, background: "var(--color-bg)", padding: "6px 20px" }}>
                  <span style={{ color: "var(--color-accent)", fontSize: 11, fontStyle: "italic", whiteSpace: "nowrap" }}>
                    {diffInfo.label} — {diffInfo.short}
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 3. JUSTIFY YOUR PICK ────────────────────────────────────────── */}
      <ClipCard>
        <CardHeader num={3} label="Justify Your Pick"
          tip="Move each slider toward the fighter you think has the advantage. Your allocation shapes the Community Edge metric." />
        <div className="px-4 pt-3 pb-4">
          <p className="text-[10px] text-center mb-4" style={{ color: "var(--color-text-ghost)" }}>
            Move the sliders toward the fighter with the advantage
          </p>

          {/* Full-width fighter labels */}
          <div className="flex justify-between mb-3">
            <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--color-side-a)" }}>
              Team A
            </span>
            <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: "var(--color-side-b)" }}>
              Team B
            </span>
          </div>

          <div style={{ position: "relative" }}>
            {!isLoggedIn && (
              <div
                onClick={() => window.dispatchEvent(new CustomEvent("awb:rankgate", {
                  detail: { required: "Private", current: null, xpNeeded: null, isGuest: true },
                }))}
                style={{ position: "absolute", inset: 0, zIndex: 10, cursor: "pointer" }}
              />
            )}
            <div className="space-y-1">
              {STATS.map((stat) => (
                <StatSlider key={stat.slug} stat={stat} value={statValues[stat.slug] ?? 50}
                  onChange={(v) => setStatValues((p) => ({ ...p, [stat.slug]: v }))} disabled={!isLoggedIn} />
              ))}
            </div>
          </div>

          {!isLoggedIn && (
            <p className="text-center text-[10px] pt-3" style={{ color: "var(--color-text-ghost)" }}>
              <Link href="/login" style={{ color: "var(--color-accent)" }} className="hover:underline">Sign in</Link>{" "}
              to submit slider ratings
            </p>
          )}
        </div>
      </ClipCard>

      {/* Error */}
      {error && <p className="text-sm text-center text-red-400 py-1">{error}</p>}

      {/* Guest register prompt */}
      {showRegisterPrompt && !isLoggedIn && (
        <ClipCard>
          <div className="p-5 text-center space-y-3"
            style={{ border: "2px solid var(--color-accent)", boxShadow: GLOW.accent }}>
            <p className="font-black text-base">Create an account to lock in your prediction</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Your pick —{" "}
              <strong style={{ color: "var(--color-text-base)" }}>
                {verdict === "draw" ? "Draw" : verdict === "a" ? labelA : labelB} wins ·{" "}
                {DIFFICULTIES.find((d) => d.value === difficulty)?.label}
              </strong>{" "}
              — has been saved. Register to submit it officially.
            </p>
            <div className="flex gap-2 justify-center">
              <Link href={`/login?returnTo=/battles/${matchupSlug}`}
                className="inline-flex items-center gap-2 font-black px-5 py-2.5 text-sm"
                style={{ background: "var(--color-accent)", color: "#fff" }}>
                <Swords size={13} /> Join Free
              </Link>
              <Link href={`/login?returnTo=/battles/${matchupSlug}`}
                className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 text-sm"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}>
                Sign In
              </Link>
            </div>
          </div>
        </ClipCard>
      )}

      {/* Share prediction — only when logged in and vote exists */}
      {isLoggedIn && existingVote?.id && (
        <div className="flex justify-center pt-1">
          <Link
            href={`/battles/${matchupSlug}/share/${existingVote.id}`}
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg transition-colors"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            🔗 Share my prediction
          </Link>
        </div>
      )}

      {/* Action bar */}
      {!showRegisterPrompt && (
        <div className="flex items-center gap-3 pt-1">
          {/* Reset — octagonal, single-button, inset border sim */}
          <div style={{ filter: "drop-shadow(0 0 4px rgba(148,163,184,0.18))" }}>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm font-semibold px-4 py-3"
              style={{
                clipPath: CLIP,
                background: "var(--color-surface)",
                color: "var(--color-text-muted)",
                boxShadow: "inset 0 0 0 2px var(--color-border), inset 0 0 10px rgba(148,163,184,0.12)",
              }}
            >
              <RotateCcw size={15} /> Reset
            </button>
          </div>

          {/* Submit — solid orange, octagonal, outer glow when ready */}
          <div style={{
            flex: 1,
            filter: verdict && difficulty
              ? "drop-shadow(0 0 2px rgba(249,115,22,0.6)) drop-shadow(0 0 4px rgba(249,115,22,0.4))"
              : "none",
          }}>
            <button
              onClick={handleSubmit}
              disabled={isPending || !verdict || !difficulty}
              className="w-full flex items-center justify-center gap-2 font-black py-3.5 text-sm tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                clipPath: CLIP,
                background: "var(--color-accent)",
                color: "#fff",
              }}
            >
              {isPending
                ? <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Swords size={15} />}
              {isPending ? "Submitting…" : isEditMode ? "Update Prediction" : "Submit Prediction"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
