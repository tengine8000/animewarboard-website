import type { RankName } from "@/lib/ranks";

type P = { size?: number };

function PrivateIcon({ size = 16 }: P) {
  const h = Math.round(size * 0.75);
  return (
    <svg width={size} height={h} viewBox="0 0 20 15"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,13 10,2 18,13" />
    </svg>
  );
}

function CorporalIcon({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,7 10,1 18,7" />
      <polyline points="2,17 10,11 18,17" />
    </svg>
  );
}

function SergeantIcon({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 22"
      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,6 10,1 18,6" />
      <polyline points="2,12 10,7 18,12" />
      <polyline points="2,19 10,14 18,19" />
    </svg>
  );
}

function LieutenantIcon({ size = 16 }: P) {
  const h = Math.round(size * 0.45);
  return (
    <svg width={size} height={h} viewBox="0 0 20 9" fill="currentColor">
      <rect x="1" y="1" width="18" height="7" rx="2" />
    </svg>
  );
}

function ColonelIcon({ size = 16 }: P) {
  // Spread-wing eagle: wings + head + beak
  const w = Math.round(size * 1.4);
  return (
    <svg width={w} height={size} viewBox="0 0 28 20" fill="currentColor">
      {/* Wings */}
      <path d="M14,10 C11,7 6,6 1,7 C5,9 10,10 14,12 C18,10 23,9 27,7 C22,6 17,7 14,10Z" />
      {/* Head */}
      <circle cx="14" cy="5" r="3.5" />
      {/* Beak */}
      <path d="M17,4.5 L20.5,6 L17,7Z" />
      {/* Tail */}
      <path d="M12,12 L11,18 L14,16 L17,18 L16,12Z" />
    </svg>
  );
}

function GeneralIcon({ size = 16 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12,1 15.3,8.4 23.5,9.6 17.7,15.2 19.1,23.4 12,19.5 4.9,23.4 6.3,15.2 0.5,9.6 8.7,8.4" />
    </svg>
  );
}

function FieldMarshalIcon({ size = 16 }: P) {
  // Three stars in a row
  const w = Math.round(size * 2.2);
  return (
    <svg width={w} height={size} viewBox="0 0 66 20" fill="currentColor">
      <polygon points="11,1 13.5,8 21,8 15.2,12.5 17.5,19.5 11,15.5 4.5,19.5 6.8,12.5 1,8 8.5,8" />
      <polygon points="33,1 35.5,8 43,8 37.2,12.5 39.5,19.5 33,15.5 26.5,19.5 28.8,12.5 23,8 30.5,8" />
      <polygon points="55,1 57.5,8 65,8 59.2,12.5 61.5,19.5 55,15.5 48.5,19.5 50.8,12.5 45,8 52.5,8" />
    </svg>
  );
}

const ICONS: Record<RankName, React.FC<P>> = {
  "Private":       PrivateIcon,
  "Corporal":      CorporalIcon,
  "Sergeant":      SergeantIcon,
  "Lieutenant":    LieutenantIcon,
  "Colonel":       ColonelIcon,
  "General":       GeneralIcon,
  "Field Marshal": FieldMarshalIcon,
};

export function RankIcon({ rank, size = 16 }: { rank: RankName; size?: number }) {
  const Icon = ICONS[rank];
  return <Icon size={size} />;
}
