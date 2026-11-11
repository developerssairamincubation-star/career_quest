"use client";

import { useEffect, useRef } from "react";

/** A number that rolls up from zero when it first comes into view. Server-rendered at its final value. */
export function CountUp({ value, delay = 0, duration = 1.8 }: { value: number; delay?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    el.textContent = fmt(0);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now() + delay * 1000;
      const tick = (now: number) => {
        const k = Math.min(1, Math.max(0, (now - t0) / (duration * 1000)));
        el.textContent = fmt(value * (1 - Math.pow(1 - k, 4)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.textContent = fmt(value);
    };
  }, [value, delay, duration]);

  return (
    <span ref={ref} className="tabular">
      {fmt(value)}
    </span>
  );
}

/** Brings the roll call into view when a class is chosen. */
export function ScrollIntoView({ id }: { id: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.parentElement?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [id]);
  return <span ref={ref} hidden />;
}
