"use client";

import { useState } from "react";
import { Users } from "lucide-react";

export type CarouselFighter = {
  slug: string;
  name: string;
  series: string;
  imageUrl: string | null;
};

const COLOR_A = "var(--color-side-a)";
const COLOR_B = "var(--color-side-b)";
const GLOW_A  = "0 0 0 1.5px rgba(248,113,113,0.8), 0 0 14px rgba(248,113,113,0.45)";
const GLOW_B  = "0 0 0 1.5px rgba(96,165,250,0.8),  0 0 14px rgba(96,165,250,0.45)";

export function PortraitCarousel({
  fighters,
  side,
}: {
  fighters: CarouselFighter[];
  side: "a" | "b";
}) {
  const [idx, setIdx] = useState(0);
  const color  = side === "a" ? COLOR_A : COLOR_B;
  const glow   = side === "a" ? GLOW_A  : GLOW_B;
  const count  = fighters.length;
  const active = fighters[idx] ?? fighters[0];
  if (!active) return <div style={{ flex: 1 }} />;

  function go(dir: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIdx(i => (i + dir + count) % count);
  }

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        position: "relative",
        aspectRatio: "3 / 4",
        borderRadius: 10, overflow: "hidden",
        border: `1.5px solid ${color}`,
        boxShadow: glow,
        background: "var(--color-surface-hover)",
      }}>
        {/* Character image */}
        {active.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={active.slug}
            src={active.imageUrl}
            alt={active.name}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "top",
            }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, fontWeight: 900, color,
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
          }}>
            {active.name[0]}
          </div>
        )}

        {/* Team chip */}
        <div style={{
          position: "absolute", top: 6,
          left: side === "a" ? 6 : "auto",
          right: side === "b" ? 6 : "auto",
          display: "flex",
          flexDirection: side === "b" ? "row-reverse" : "row",
          alignItems: "center", gap: 3,
          background: "rgba(0,0,0,0.52)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          borderRadius: 5, padding: "2px 5px",
        }}>
          <Users size={8} style={{ color, flexShrink: 0 }} />
          <span style={{
            fontSize: 7, fontWeight: 900,
            letterSpacing: "0.1em", color,
            textTransform: "uppercase" as const,
          }}>
            TEAM {side.toUpperCase()}
          </span>
          {count > 1 && (
            <span style={{
              fontSize: 7, fontWeight: 900, color,
              border: `1px solid ${color}80`,
              borderRadius: "50%",
              width: 14, height: 14,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              background: `color-mix(in srgb, ${color} 25%, transparent)`,
            }}>
              {count}
            </span>
          )}
        </div>

        {/* Carousel arrows */}
        {count > 1 && (
          <>
            <button
              onClick={(e) => go(-1, e)}
              style={{
                position: "absolute", left: 6, top: "50%",
                transform: "translateY(-50%)",
                width: 22, height: 22,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                border: `1.5px solid ${color}`,
                boxShadow: `0 0 6px ${color}60`,
                outline: "none",
                color: "#fff",
                fontSize: 14, fontWeight: 900,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, padding: 0,
              }}
            >
              ‹
            </button>
            <button
              onClick={(e) => go(1, e)}
              style={{
                position: "absolute", right: 6, top: "50%",
                transform: "translateY(-50%)",
                width: 22, height: 22,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                border: `1.5px solid ${color}`,
                boxShadow: `0 0 6px ${color}60`,
                outline: "none",
                color: "#fff",
                fontSize: 14, fontWeight: 900,
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                lineHeight: 1, padding: 0,
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Name + dot indicators overlay */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.88) 55%)",
          padding: "28px 7px 7px",
          textAlign: side === "a" ? "left" : "right",
        }}>
          {count > 1 && (
            <div style={{
              display: "flex",
              justifyContent: side === "a" ? "flex-start" : "flex-end",
              gap: 3, marginBottom: 4,
            }}>
              {fighters.map((_, i) => (
                <div key={i} style={{
                  width: i === idx ? 10 : 3,
                  height: 3, borderRadius: 2,
                  background: i === idx ? color : "rgba(255,255,255,0.3)",
                  transition: "width 0.2s, background 0.2s",
                }} />
              ))}
            </div>
          )}
          <p style={{
            margin: 0,
            fontSize: 9, fontWeight: 900, lineHeight: 1.2,
            color, wordBreak: "break-word" as const,
            textShadow: "0 1px 4px rgba(0,0,0,0.95)",
          }}>
            {active.name}
          </p>
          <p style={{
            margin: "1px 0 0",
            fontSize: 7, color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.05em",
          }}>
            {active.series}
          </p>
        </div>
      </div>
    </div>
  );
}
