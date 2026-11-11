"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const SRC = "/houses/alliance-clear.png";
const DURATION = 3400;       // ms until the last speck lands
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const out = (t: number) => 1 - Math.pow(1 - t, 3);

type Speck = { tx: number; ty: number; r: number; g: number; b: number; delay: number; life: number; swirl: number; size: number };
type Spark = { ang: number; dist: number; delay: number; life: number; size: number };

/** The crest, assembled from golden dust: specks burst from the centre and drift out to the places
 * they hold in the logo (inner ones first, the rim last), then the sharp artwork fades in. */
export function DustLogo({ className = "" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let raf = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      raf = requestAnimationFrame(() => setDone(true));
      return () => cancelAnimationFrame(raf);
    }
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const size = box.current!.clientWidth;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = cv.height = Math.round(size * dpr);
    let cancelled = false;

    const img = new window.Image();
    img.src = SRC;
    img.onload = () => {
      if (cancelled) return;
      // sample the artwork: one speck per grid cell that is opaque, carrying that cell's colour
      const step = Math.max(2, Math.round(size / 100));
      const off = document.createElement("canvas");
      off.width = off.height = size;
      const oc = off.getContext("2d", { willReadFrequently: true })!;
      oc.drawImage(img, 0, 0, size, size);
      const px = oc.getImageData(0, 0, size, size).data;
      const c = size / 2;
      const specks: Speck[] = [];
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const i = (y * size + x) * 4;
          if (px[i + 3] < 140) continue;
          const d = Math.hypot(x - c, y - c) / c;
          specks.push({
            tx: x, ty: y, r: px[i], g: px[i + 1], b: px[i + 2],
            delay: Math.min(d, 1) * 0.5 + rnd(0, 0.08),
            life: rnd(0.28, 0.4),
            swirl: rnd(-1, 1) * size * 0.07,
            size: step * rnd(0.85, 1.25),
          });
        }
      }
      const sparks: Spark[] = Array.from({ length: 140 }, () => ({
        ang: rnd(0, Math.PI * 2), dist: rnd(0.3, 0.62) * size, delay: rnd(0, 0.6), life: rnd(0.25, 0.4), size: rnd(1.2, 3.2),
      }));

      const t0 = performance.now();
      const frame = (now: number) => {
        const p = (now - t0) / DURATION;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);
        for (const s of specks) {
          const t = Math.min(1, Math.max(0, (p - s.delay) / s.life));
          if (t <= 0) continue;
          const e = out(t);
          const wob = Math.sin(Math.PI * t) * s.swirl;             // drift sideways on the way out
          const rx = s.tx - c, ry = s.ty - c, rl = Math.hypot(rx, ry) || 1;
          const x = c + rx * e - (ry / rl) * wob;
          const y = c + ry * e + (rx / rl) * wob;
          const glow = (1 - t) * 0.75;                              // gold while in flight, true colour on arrival
          ctx.globalAlpha = Math.min(1, t * 4);
          ctx.fillStyle = `rgb(${s.r + (255 - s.r) * glow | 0},${s.g + (222 - s.g) * glow | 0},${s.b + (140 - s.b) * glow | 0})`;
          const sz = s.size * (0.4 + 0.6 * e);
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
        for (const k of sparks) {                                   // loose motes that fly past the rim and fade
          const t = Math.min(1, Math.max(0, (p - k.delay) / k.life));
          if (t <= 0 || t >= 1) continue;
          const e = out(t);
          ctx.globalAlpha = Math.sin(Math.PI * t) * 0.9;
          ctx.fillStyle = "#f4cf6a";
          ctx.beginPath();
          ctx.arc(c + Math.cos(k.ang) * k.dist * e, c + Math.sin(k.ang) * k.dist * e, k.size * (1 - t * 0.5), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (p > 0.9) setDone(true);                                 // sharp artwork fades in over the last specks
        if (p < 1.15) raf = requestAnimationFrame(frame);
        else ctx.clearRect(0, 0, size, size);
      };
      raf = requestAnimationFrame(frame);
    };
    img.onerror = () => {
      raf = requestAnimationFrame(() => setDone(true));
    };
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={box} className={`relative aspect-square ${className}`}>
      <canvas ref={canvas} className="absolute inset-0 size-full" aria-hidden />
      <Image
        src={SRC}
        alt="Sairam Grand House Alliance crest"
        fill
        priority
        sizes="(min-width: 1024px) 30rem, 20rem"
        className="dust-fallback object-contain transition-opacity duration-700"
        style={{ opacity: done ? 1 : 0 }}
      />
      <noscript>
        <style>{".dust-fallback{opacity:1!important}"}</style>
      </noscript>
    </div>
  );
}
