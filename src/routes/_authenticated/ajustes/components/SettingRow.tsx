interface SettingRowProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export default function SettingRow({ label, hint, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && (
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
            {hint}
          </p>
        )}
      </div>
      <div className="w-64 shrink-0">{children}</div>
    </div>
  );
}
