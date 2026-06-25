import { db } from "@/db";
import { analyticsEvents } from "@/db/schema";

type EventType =
  | "page_view"
  | "prediction_submitted"
  | "anonymous_prediction"
  | "battle_hopped"
  | "comment_posted"
  | "share_card_opened";

export async function trackEvent(opts: {
  sessionId: string;
  userId?: string | null;
  eventType: EventType;
  path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.insert(analyticsEvents).values({
      sessionId: opts.sessionId,
      userId:    opts.userId ?? null,
      eventType: opts.eventType,
      path:      opts.path ?? null,
      referrer:  opts.referrer ?? null,
      metadata:  opts.metadata ?? null,
    });
  } catch {
    // Never let analytics failure break page rendering
  }
}
