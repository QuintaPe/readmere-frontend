import { useEffect, useState } from "react";
import { Toaster as Sonner } from "sonner";
import { subscribeTheme, type ResolvedTheme } from "@/lib/theme";

type ToasterProps = React.ComponentProps<typeof Sonner>;

// Sigue el tema efectivo de la app en vivo (claro/oscuro/sistema).
function useResolvedTheme(): ResolvedTheme {
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  useEffect(() => subscribeTheme(setResolved), []);
  return resolved;
}

// Toast a juego con el tema oscuro índigo de la app: tarjeta translúcida con
// blur (como los popovers), barra de acento a la izquierda y el icono dentro de
// un halo circular tintado según el tipo. Sustituye a `richColors`, cuyos fondos
// rojo/verde saturados chocaban con la paleta.
const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedTheme();
  return (
    <Sonner
      theme={theme}
      gap={10}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast pointer-events-auto flex w-full items-center gap-3 " +
            "overflow-hidden rounded-xl !border !border-border/70 !bg-popover/85 " +
            "p-4 text-sm !text-foreground backdrop-blur-xl " +
            "shadow-[0_12px_36px_-10px_rgb(0_0_0/0.6)] " +
            "!border-l-[3px] border-l-primary " +
            // Icono → halo circular con el acento del tipo
            "[&>[data-icon]]:m-0 [&>[data-icon]]:flex [&>[data-icon]]:size-8 " +
            "[&>[data-icon]]:shrink-0 [&>[data-icon]]:items-center " +
            "[&>[data-icon]]:justify-center [&>[data-icon]]:rounded-full " +
            "[&>[data-icon]]:bg-primary/15 " +
            "[&>[data-icon]>svg]:size-[18px] [&>[data-icon]>svg]:text-primary",
          success:
            "!border-l-[var(--success)] " +
            "[&>[data-icon]]:!bg-[color-mix(in_oklab,var(--success)_16%,transparent)] " +
            "[&>[data-icon]>svg]:!text-[var(--success)]",
          error:
            "!border-l-[var(--destructive)] " +
            "[&>[data-icon]]:!bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)] " +
            "[&>[data-icon]>svg]:!text-[var(--destructive)]",
          warning:
            "!border-l-[var(--warning)] " +
            "[&>[data-icon]]:!bg-[color-mix(in_oklab,var(--warning)_16%,transparent)] " +
            "[&>[data-icon]>svg]:!text-[var(--warning)]",
          info:
            "!border-l-primary [&>[data-icon]]:!bg-primary/15 " +
            "[&>[data-icon]>svg]:!text-primary",
          title: "text-[13.5px] font-medium leading-snug text-foreground",
          description:
            "!text-muted-foreground text-[12.5px] leading-relaxed mt-0.5",
          actionButton:
            "!bg-primary !text-primary-foreground !rounded-md !px-2.5 !py-1 " +
            "!text-xs !font-medium hover:!bg-primary/90 transition-colors",
          cancelButton:
            "!bg-muted !text-muted-foreground !rounded-md !px-2.5 !py-1 " +
            "!text-xs hover:!bg-accent transition-colors",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
