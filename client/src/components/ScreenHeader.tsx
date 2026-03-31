interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: ScreenHeaderProps) {
  return (
    <div className="px-5 pt-4 pb-3 flex items-start justify-between" style={{ paddingTop: "max(16px, env(safe-area-inset-top, 16px))" }}>
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: "#F0F0F0" }}>{title}</h1>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#999" }}>{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
