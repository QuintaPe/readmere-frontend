import { Link } from "react-router-dom";
import { BrandMark } from "@/components/BrandMark";

/* Mismos ejes de Fraunces que usa el resto de la identidad */
const display = { fontVariationSettings: '"opsz" 144, "SOFT" 40, "WONK" 1' } as const;

type Size = "sm" | "md" | "lg";

const SIZES: Record<Size, { chip: string; mark: string; text: string; gap: string }> = {
  sm: { chip: "h-7 w-7 rounded-lg", mark: "h-4 w-4", text: "text-[17px]", gap: "gap-2" },
  md: { chip: "h-8 w-8 rounded-lg", mark: "h-5 w-5", text: "text-[19px]", gap: "gap-2.5" },
  lg: { chip: "h-10 w-10 rounded-xl", mark: "h-6 w-6", text: "text-[24px]", gap: "gap-3" },
};

type BrandLogoProps = {
  size?: Size;
  to?: string;
  className?: string;
  /** Oculta el wordmark y deja solo el símbolo */
  markOnly?: boolean;
};

/**
 * Logo de Readmere: símbolo (libro sobre onda) + wordmark "Read·mere".
 * Un único lockup reutilizable en nav, footer y login para que la marca
 * aparezca de forma consistente en toda la web.
 */
export function BrandLogo({ size = "md", to, className = "", markOnly = false }: BrandLogoProps) {
  const s = SIZES[size];

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      <span
        className={`grid ${s.chip} shrink-0 place-items-center bg-primary text-primary-foreground shadow-sm ring-1 ring-inset ring-white/10`}
      >
        <BrandMark className={s.mark} />
      </span>
      {!markOnly && (
        <span className={`font-serif font-semibold leading-none tracking-tight ${s.text}`} style={display}>
          Read<span className="text-primary">mere</span>
        </span>
      )}
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        viewTransition
        aria-label="Readmere"
        className="inline-flex items-center rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
