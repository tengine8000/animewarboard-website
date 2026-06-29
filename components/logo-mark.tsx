type Props = { size?: number; priority?: boolean };

export function LogoMark({ size = 38 }: Props) {
  return (
    <span style={{ position: "relative", display: "inline-flex", width: size, height: size, flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="AWB" width={size} height={size} className="logo-light" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-dark.png" alt="AWB" width={size} height={size} className="logo-dark" style={{ position: "absolute", inset: 0 }} />
    </span>
  );
}
