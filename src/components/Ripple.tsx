type RippleProps = React.SVGProps<SVGSVGElement>;

/**
 * Firma visual de Readmere: la onda de agua del símbolo ("mere" = lago),
 * como línea horizontal. Pensada para subrayados y separadores.
 * Usa `currentColor` y trazo de grosor constante al estirarse.
 */
export function Ripple({ className, ...props }: RippleProps) {
  return (
    <svg
      viewBox="0 0 300 12"
      preserveAspectRatio="none"
      fill="none"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path
        d="M2 6c12-5 25-5 37 0s25 5 37 0 25-5 37 0 25 5 37 0 25-5 37 0 25 5 37 0 25-5 37 0"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
