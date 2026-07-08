import { useState, useRef, useEffect, useLayoutEffect } from "react";

interface Props {
  hasFile: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renditionRef: React.RefObject<any>;
  viewerRef: React.RefObject<HTMLElement | null>;
}

export function useFollowScroll({ hasFile, renditionRef, viewerRef }: Props) {
  const [followScroll, setFollowScroll] = useState(false);
  const followScrollRef = useRef(false);
  useLayoutEffect(() => { followScrollRef.current = followScroll; }, [followScroll]);

  const suppressScrollUntilRef = useRef(0);
  const lastTargetYRef = useRef(0);
  const lastAutoScrollTopRef = useRef(-1);

  function getContainer(): HTMLElement | null {
    return renditionRef.current?.manager?.container ?? viewerRef.current ?? null;
  }

  // Detect manual scroll → disengage follow
  useEffect(() => {
    if (!followScroll) return;
    const container = getContainer();
    if (!container) return;
    const onScroll = () => {
      if (performance.now() < suppressScrollUntilRef.current) return;
      if (Math.abs(container.scrollTop - lastAutoScrollTopRef.current) < 4) return;
      setFollowScroll(false);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followScroll]);

  // On load: snap scroll to audio cursor position, retrying until content is tall enough
  useEffect(() => {
    if (!hasFile) return;
    const giveUpAt = Date.now() + 10_000;
    let lastScrollHeight = 0;
    let stableHeightTicks = 0;
    const id = setInterval(() => {
      const targetY = lastTargetYRef.current;
      if (targetY <= 0 || isNaN(targetY)) return;
      const container = getContainer();
      if (!container) return;
      const scrollTo = Math.max(0, targetY - container.clientHeight * 0.38);
      if (isNaN(scrollTo)) return;
      if (Math.abs(container.scrollTop - scrollTo) < 10) { clearInterval(id); return; }
      if (container.scrollHeight === lastScrollHeight) {
        stableHeightTicks++;
        if (stableHeightTicks >= 3 || Date.now() > giveUpAt) { clearInterval(id); return; }
      } else {
        lastScrollHeight = container.scrollHeight;
        stableHeightTicks = 0;
      }
      suppressScrollUntilRef.current = performance.now() + 200;
      container.scrollTop = scrollTo;
    }, 100);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFile]);

  function handleFollowClick() {
    const container = getContainer();
    if (container && lastTargetYRef.current > 0) {
      suppressScrollUntilRef.current = performance.now() + 500;
      container.scrollTop = Math.max(0, lastTargetYRef.current - container.clientHeight * 0.38);
    }
    setFollowScroll(true);
  }

  return {
    followScroll,
    setFollowScroll,
    followScrollRef,
    suppressScrollUntilRef,
    lastTargetYRef,
    lastAutoScrollTopRef,
    handleFollowClick,
  };
}
