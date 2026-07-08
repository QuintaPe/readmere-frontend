type BrandMarkProps = React.SVGProps<SVGSVGElement>;

/**
 * Readmere — símbolo de marca.
 * Un libro abierto sobre una onda de agua: "read" + "mere" (lago).
 * Traza con `currentColor`, así que hereda el color del contenedor
 * (p. ej. `text-primary-foreground` dentro del chip de la barra lateral).
 */
export function BrandMark({ className, ...props }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M12 6.6C10.1 5.4 7.9 4.8 5.5 4.8V13.6c2.4 0 4.6.6 6.5 1.8 1.9-1.2 4.1-1.8 6.5-1.8V4.8c-2.4 0-4.6.6-6.5 1.8Z" />
      <path d="M12 6.6v9" />
      <path d="M5 19.2c1.15-.85 2.3-.85 3.5 0s2.35.85 3.5 0 2.3-.85 3.5 0 2.35.85 3.5 0" />
    </svg>
  );
}
