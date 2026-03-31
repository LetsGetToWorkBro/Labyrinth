import { getBeltColor, getBeltTextColor } from "@/lib/constants";

interface BeltBadgeProps {
  belt: string;
  size?: "sm" | "md";
}

export function BeltBadge({ belt, size = "sm" }: BeltBadgeProps) {
  const bg = getBeltColor(belt);
  const color = getBeltTextColor(belt);
  const isSmall = size === "sm";

  return (
    <span
      className="belt-badge"
      style={{
        backgroundColor: bg,
        color,
        fontSize: isSmall ? 10 : 12,
        padding: isSmall ? "1px 8px" : "2px 10px",
        border: belt?.toLowerCase() === "white" ? "1px solid #444" : "none",
      }}
      data-testid={`belt-badge-${belt?.toLowerCase()}`}
    >
      {belt || "White"}
    </span>
  );
}

export function BeltDot({ belt, size = 8 }: { belt: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: getBeltColor(belt),
        display: "inline-block",
        border: belt?.toLowerCase() === "white" ? "1px solid #444" : "none",
        flexShrink: 0,
      }}
    />
  );
}
