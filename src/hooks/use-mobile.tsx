import * as React from "react";

// Hasta tablet (incl. iPad en vertical) el sidebar va off-canvas tras el botón
// del header en vez de acoplado; solo se acopla en pantallas anchas (>=1024).
const MOBILE_BREAKPOINT = 1024;

// Teléfono de verdad: puntero grueso Y pantalla estrecha. Un iPad es táctil
// pero ancho — ahí caben los layouts de escritorio (con zonas pulsables
// generosas); los layouts compactos reorganizados son solo para móvil.
// Reactivo: al rotar el dispositivo la media query puede cambiar.
const PHONE_QUERY = "(pointer: coarse) and (max-width: 640px)";

export function useIsPhone() {
  const [isPhone, setIsPhone] = React.useState<boolean>(
    () => window.matchMedia(PHONE_QUERY).matches,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(PHONE_QUERY);
    const onChange = () => setIsPhone(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isPhone;
}

export function useIsMobile() {
  // Valor correcto desde el primer render (antes arrancaba en undefined y un
  // setState síncrono en el efecto lo corregía, causando un render extra).
  const [isMobile, setIsMobile] = React.useState<boolean>(
    () => window.innerWidth < MOBILE_BREAKPOINT,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
