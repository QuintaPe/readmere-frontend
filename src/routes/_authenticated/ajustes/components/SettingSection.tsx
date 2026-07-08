interface SettingSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function SettingSection({
  title,
  children,
}: SettingSectionProps) {
  return (
    <div>
      <p className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70">
        {title}
      </p>
      <div className="rounded-xl border border-border/50 bg-card divide-y divide-border/40 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
