"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ThumbsUp, ThumbsDown, CornerDownRight, Trash2 } from "lucide-react";
import { postCommentAction, toggleCommentVoteAction } from "@/app/actions/comment";
import { deleteCommentAction } from "@/app/actions/admin-moderation";
import type { CommentRow } from "@/lib/queries";
import Link from "next/link";
import { RankBadge, ModBadge } from "@/components/rank-badge";

type Props = {
  type:        "matchup" | "entity";
  targetId:    string;
  targetSlug:  string;
  isLoggedIn:  boolean;
  isMod:       boolean;
  userInitial: string;
  comments:    CommentRow[];
};

function Avatar({ initial, image }: { initial: string; image: string | null }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={initial} className="w-8 h-8 rounded-full object-cover shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white"
      style={{ background: "var(--color-accent)" }}>
      {initial}
    </div>
  );
}

function formatAge(date: Date): string {
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60)    return `${secs}s`;
  if (secs < 3600)  return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}

function CommentInput({
  type, targetId, targetSlug, parentId, userInitial, placeholder, onPosted,
}: {
  type:        "matchup" | "entity";
  targetId:    string;
  targetSlug:  string;
  parentId?:   string;
  userInitial: string;
  placeholder: string;
  onPosted?:   () => void;
}) {
  const [body,    setBody]    = useState("");
  const [error,   setError]   = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [isPending, start]    = useTransition();
  const router = useRouter();

  async function submit() {
    if (!body.trim()) return;
    setError(null);
    start(async () => {
      const res = await postCommentAction(type, targetId, targetSlug, body, parentId);
      if (res.ok) {
        setBody("");
        onPosted?.();
        router.refresh();
      } else {
        setError(
          res.error === "rate_limited"      ? "Slow down — wait 30 seconds between comments." :
          res.error === "too_short"         ? "Comment must be at least 3 characters." :
          res.error === "not_authenticated" ? "Sign in to comment." :
          "Something went wrong. Try again."
        );
      }
    });
  }

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white mt-0.5"
        style={{ background: "var(--color-accent)" }}>
        {userInitial}
      </div>
      <div className="flex-1 space-y-2">
        <textarea
          rows={2} value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          suppressHydrationWarning
          className="w-full text-sm px-3 py-2 resize-none outline-none transition-colors"
          style={{
            background: "var(--color-bg)",
            border: `1px solid ${focused ? "var(--color-accent)" : "var(--color-border)"}`,
            color: "var(--color-text-base)",
          }}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button
          onClick={submit} disabled={isPending || !body.trim()}
          className="text-xs font-black px-4 py-1.5 transition-opacity disabled:opacity-40"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          {isPending ? "Posting…" : "Post"}
        </button>
      </div>
    </div>
  );
}

function CommentCard({
  comment, type, targetId, targetSlug, isLoggedIn, isMod, userInitial, isReply,
}: {
  comment:     CommentRow;
  type:        "matchup" | "entity";
  targetId:    string;
  targetSlug:  string;
  isLoggedIn:  boolean;
  isMod:       boolean;
  userInitial: string;
  isReply:     boolean;
}) {
  const [showReply, setShowReply] = useState(false);
  const [deleted,   setDeleted]   = useState(false);
  const [score,     setScore]     = useState(comment.score);
  const [isPending, start]        = useTransition();
  const router = useRouter();

  function vote(val: 1 | -1) {
    if (!isLoggedIn) return;
    setScore((s) => s + val);
    start(async () => {
      await toggleCommentVoteAction(comment.id, targetSlug, type, val);
      router.refresh();
    });
  }

  function remove() {
    if (!confirm("Delete this comment?")) return;
    setDeleted(true);
    start(async () => {
      await deleteCommentAction(comment.id, type, targetSlug);
      router.refresh();
    });
  }

  const initial = comment.user.name?.[0]?.toUpperCase() ?? "?";
  const registerPath = type === "matchup" ? `/login?returnTo=/battles/${targetSlug}` : `/login?returnTo=/characters/${targetSlug}`;

  if (deleted) return null;

  return (
    <div className={isReply ? "ml-10" : ""}>
      <div className="flex gap-3">
        <Avatar initial={initial} image={comment.user.image} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-black" style={{ color: "var(--color-text-base)" }}>
              {comment.user.name ?? "Anonymous"}
            </span>
            {comment.user.role === "moderator" && <ModBadge />}
            <RankBadge rank={comment.user.rank} size="xs" />
            <span className="text-[10px]" style={{ color: "var(--color-text-ghost)" }}>
              {formatAge(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)", wordBreak: "break-word" }}>
            {comment.body}
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => vote(1)} disabled={isPending || !isLoggedIn}
              className="flex items-center gap-1 text-[11px] transition-colors disabled:opacity-40"
              style={{ color: score > 0 ? "var(--color-accent)" : "var(--color-text-ghost)" }}>
              <ThumbsUp size={11} />
              {score > 0 ? score : ""}
            </button>
            <button onClick={() => vote(-1)} disabled={isPending || !isLoggedIn}
              className="flex items-center gap-1 text-[11px] transition-colors disabled:opacity-40"
              style={{ color: score < 0 ? "#ef4444" : "var(--color-text-ghost)" }}>
              <ThumbsDown size={11} />
            </button>
            {!isReply && isLoggedIn && (
              <button onClick={() => setShowReply((v) => !v)}
                className="flex items-center gap-1 text-[11px]"
                style={{ color: "var(--color-text-ghost)" }}>
                <CornerDownRight size={11} />
                {showReply ? "Cancel" : "Reply"}
              </button>
            )}
            {isMod && (
              <button onClick={remove} disabled={isPending}
                className="flex items-center gap-1 text-[11px] ml-auto transition-colors disabled:opacity-40"
                style={{ color: "#ef444480" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#ef444480")}
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
          {showReply && (
            <div className="mt-3">
              <CommentInput
                type={type} targetId={targetId} targetSlug={targetSlug}
                parentId={comment.id} userInitial={userInitial}
                placeholder="Write a reply…" onPosted={() => setShowReply(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentSection({ type, targetId, targetSlug, isLoggedIn, isMod, userInitial, comments }: Props) {
  const topLevel = comments.filter((c) => !c.parentId);
  const replyMap = new Map<string, CommentRow[]>();
  for (const r of comments.filter((c) => c.parentId)) {
    const list = replyMap.get(r.parentId!) ?? [];
    list.push(r);
    replyMap.set(r.parentId!, list);
  }

  const registerPath = type === "matchup"
    ? `/login?returnTo=/battles/${targetSlug}`
    : `/login?returnTo=/characters/${targetSlug}`;

  return (
    <div>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {isLoggedIn ? (
          <CommentInput
            type={type} targetId={targetId} targetSlug={targetSlug}
            userInitial={userInitial} placeholder="Share your reasoning…"
          />
        ) : (
          <p className="text-sm text-center py-1" style={{ color: "var(--color-text-muted)" }}>
            <Link href={registerPath} className="hover:underline" style={{ color: "var(--color-accent)" }}>
              Join AnimeWarBoard
            </Link>{" "}
            to join the debate
          </p>
        )}
      </div>

      {topLevel.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-muted)" }}>
            No comments yet. Be the first to make a case.
          </p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
          {topLevel.map((c) => (
            <div key={c.id} className="px-4 py-4 space-y-4">
              <CommentCard
                comment={c} type={type} targetId={targetId} targetSlug={targetSlug}
                isLoggedIn={isLoggedIn} isMod={isMod} userInitial={userInitial} isReply={false}
              />
              {(replyMap.get(c.id) ?? []).map((r) => (
                <CommentCard
                  key={r.id} comment={r} type={type} targetId={targetId} targetSlug={targetSlug}
                  isLoggedIn={isLoggedIn} isMod={isMod} userInitial={userInitial} isReply={true}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
