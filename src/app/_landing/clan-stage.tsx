"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export type StageHouse = {
  id: string;
  name: string;
  crest: string;
  card: ReactNode;
  color: string;
  onColor: string;
  /** Standing, once the alliance totals are available; the finale ranks houses by it. */
  rank?: number;
  points?: number;
  members?: number;
};

// World layout: islands strung along a gentle zigzag so each sweep has some lateral travel.
const SPOTS: [number, number, number][] = [
  [0, 0, 0],
  [52, 4, -30],
  [104, -2, 4],
  [152, 5, -28],
];
// Turn each island so its orbit opens on the best view (Veera: cubs in front, the tiger's rock behind).
const YAW = [Math.PI, 0, 0, 0];
const ORBIT = 1;          // scroll units spent circling an island
const SWEEP = 0.5;        // scroll units spent flying to the next one
const ASSEMBLE = 0.8;     // ...then the islands fly into the final ranking
const HOLD = 0.6;         // ...and the ranking rests before the footer
const VH_PER_UNIT = 190;  // page height per scroll unit (vh)

// Finale: the islands line up by score around this point (a descending staircase on wide screens,
// a 2x2 grid read left to right on narrow ones).
const FC = new THREE.Vector3(76, 2, -12);
const GAP = 20;
const fmt = (n: number) => n.toLocaleString("en-IN");

const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * The clan islands as one three.js scene. Islands bob and play their baked loops all the time;
 * scrolling moves only the camera: a full orbit of the current island, then one eased sweep to
 * the next. The stage is pinned, so the page itself never appears to scroll.
 */
export function ClanStage({ houses }: { houses: StageHouse[] }) {
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);              // 0..n-1 is a house; n is the final line-up
  const [ready, setReady] = useState(false);
  const n = houses.length;
  const tour = n * ORBIT + (n - 1) * SWEEP;
  const units = tour + ASSEMBLE + HOLD;
  // Houses in finishing order (ties keep the crest order); `rankIndex[i]` is house i's place in the line.
  const order = useMemo(() => houses.map((_, i) => i).sort((a, b) => (houses[a].rank ?? a + 1) - (houses[b].rank ?? b + 1) || a - b), [houses]);
  const rankIndex = useMemo(() => order.map((_, i) => order.indexOf(i)), [order]);
  const labels = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const el = canvas.current!;
    const sec = section.current!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ canvas: el, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const fog = new THREE.Fog(0xe4edf3, 70, 170);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(38, 1, 0.5, 400);
    scene.add(new THREE.HemisphereLight(0xeaf2fa, 0x8a7a58, 0.75));
    const sun = new THREE.DirectionalLight(0xfff1dc, 1.7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = sun.shadow.camera.bottom = -16;
    sun.shadow.camera.right = sun.shadow.camera.top = 16;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 80;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.03;
    scene.add(sun, sun.target);

    const centres = SPOTS.slice(0, n).map((p) => new THREE.Vector3(...p));
    const groups: THREE.Group[] = [];
    const mixers: THREE.AnimationMixer[] = [];
    const loader = new GLTFLoader();
    let loaded = 0;
    houses.forEach((h, i) => {
      const g = new THREE.Group();
      g.position.copy(centres[i]);
      g.rotation.y = YAW[i] ?? 0;
      scene.add(g);
      groups.push(g);
      loader.load(`/clans/${h.id}.glb`, (gltf) => {
        gltf.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh) return;
          m.frustumCulled = false;            // skinned and flying meshes leave their rest bounds
          const mat = m.material as THREE.MeshStandardMaterial;
          if (mat.name === "Beam") {          // lighthouse beam: soft additive light, no shadow
            mat.transparent = true;
            mat.opacity = 0.22;
            mat.depthWrite = false;
            mat.blending = THREE.AdditiveBlending;
            mat.side = THREE.DoubleSide;
            return;
          }
          m.castShadow = m.receiveShadow = mat.name !== "Lamp";
          mat.flatShading = true;
          mat.side = THREE.DoubleSide;        // thin wings, tails and sails show from both sides
          if (mat.name !== "Lamp") {
            mat.roughness = 0.9;
            mat.metalness = 0;
          }
          mat.needsUpdate = true;
        });
        g.add(gltf.scene);
        const clip = gltf.animations.find((a) => a.name === "Loop") ?? gltf.animations[0];
        if (clip) {
          const mixer = new THREE.AnimationMixer(gltf.scene);
          mixer.clipAction(clip).play();
          mixer.setTime(Math.random() * clip.duration);
          mixers.push(mixer);
        }
        if (++loaded === 1 || i === 0) setReady(true);   // show the stage once the first island is in
      });
    });

    // ---- camera path: orbit i, sweep i -> i+1, ...
    const wide = () => camera.aspect >= 1.15;
    const radius = () => (camera.aspect < 0.8 ? 37 : camera.aspect < 1.2 ? 31 : 27);
    const finalSpot = (k: number) => (wide()
      ? new THREE.Vector3(FC.x + (k - 1.5) * GAP, FC.y + (1.5 - k) * 1.6, FC.z)
      : new THREE.Vector3(FC.x + ((k % 2) - 0.5) * GAP, FC.y + (k < 2 ? 1.2 : -1.2), FC.z + (k < 2 ? -0.5 : 0.5) * GAP * 0.9));
    // Pull back far enough that the whole line-up fits the frame, whatever the screen shape.
    const finalPose = () => {
      const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const half = wide() ? 1.5 * GAP + 13 : GAP / 2 + 11;
      const tall = wide() ? 17 : 27;
      const d = Math.max(half / (t * camera.aspect), tall / t) * 1.04;
      const el = THREE.MathUtils.degToRad(wide() ? 20 : 36);
      return {
        pos: FC.clone().add(new THREE.Vector3(0, Math.sin(el) * d, Math.cos(el) * d)),
        look: FC.clone().add(new THREE.Vector3(0, wide() ? -4 : -3, 0)),
      };
    };
    const startAngle = (i: number) => -Math.PI / 2 + i * 0.6;
    const orbitPose = (i: number, a: number) => {
      const th = startAngle(i) + a * Math.PI * 2;
      const r = radius();
      const c = centres[i];
      const pos = new THREE.Vector3(c.x + Math.cos(th) * r, c.y + 8 + Math.sin(a * Math.PI * 2) * 1.2, c.z + Math.sin(th) * r);
      const tangent = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th));
      return { pos, look: c.clone().add(new THREE.Vector3(0, -0.8, 0)), tangent };
    };
    const bezier = (p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, t: number) => {
      const u = 1 - t;
      return p0.clone().multiplyScalar(u * u * u)
        .add(p1.clone().multiplyScalar(3 * u * u * t))
        .add(p2.clone().multiplyScalar(3 * u * t * t))
        .add(p3.clone().multiplyScalar(t * t * t));
    };
    const poseAt = (u: number) => {
      if (u > tour) {                                      // the line-up: fly out to see every island
        const t = smoother(Math.min(1, (u - tour) / ASSEMBLE));
        const from = orbitPose(n - 1, 1);
        const end = finalPose();
        const k = from.pos.distanceTo(end.pos) * 0.35;
        const lift = new THREE.Vector3(0, 10, 0);
        const pos = bezier(from.pos, from.pos.clone().addScaledVector(from.tangent, k).add(lift),
          end.pos.clone().add(new THREE.Vector3(0, 12, 30)), end.pos, t);
        return { pos, look: from.look.clone().lerp(end.look, t), tangent: from.tangent, index: t > 0.2 ? n : n - 1, fin: t };
      }
      const span = ORBIT + SWEEP;
      const i = Math.min(n - 1, Math.floor(u / span));
      const local = u - i * span;
      if (local <= ORBIT || i === n - 1) {
        const a = Math.min(1, local / ORBIT);
        return { ...orbitPose(i, a), index: i, fin: 0 };
      }
      const t = smoother((local - ORBIT) / SWEEP);
      const from = orbitPose(i, 1);
      const to = orbitPose(i + 1, 0);
      const k = from.pos.distanceTo(to.pos) * 0.4;
      const pos = bezier(from.pos, from.pos.clone().addScaledVector(from.tangent, k).add(new THREE.Vector3(0, 8, 0)),
        to.pos.clone().addScaledVector(to.tangent, -k).add(new THREE.Vector3(0, 8, 0)), to.pos, t);
      const look = from.look.clone().lerp(to.look, smoother(Math.min(1, Math.max(0, (t - 0.1) / 0.8))));
      return { pos, look, tangent: from.tangent, index: t < 0.5 ? i : i + 1, fin: 0 };
    };

    const base = new THREE.Vector3();
    const target = { u: 0 };
    let current = 0;
    const readScroll = () => {
      const r = sec.getBoundingClientRect();
      const travel = r.height - window.innerHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
      target.u = p * units;
    };

    let size = { w: 1, h: 1 };
    let shownFin = -1;
    // Frame the island clear of the card: left of centre on wide screens, high on phones. The
    // line-up has no card, so the frame recentres as it forms.
    const applyView = (fin: number) => {
      const { w, h } = size;
      if (w >= 1024) camera.setViewOffset(w, h, w * 0.19 * (1 - fin), 0, w, h);
      else if (w / h < 0.8) camera.setViewOffset(w, h, 0, h * 0.2 * (1 - fin), w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      shownFin = fin;
    };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      size = { w, h };
      applyView(Math.max(0, shownFin));
    };
    resize();
    readScroll();
    current = target.u;

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: "20% 0px" });
    io.observe(sec);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    window.addEventListener("scroll", readScroll, { passive: true });

    const clock = new THREE.Clock();
    let lastIndex = -1;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.1);
      if (!visible) return;
      // ease toward the scroll position so the camera glides rather than jumps
      current += (target.u - current) * (reduce ? 1 : 1 - Math.exp(-dt * 3.2));
      const pose = poseAt(current);
      camera.position.copy(pose.pos);
      camera.lookAt(pose.look);
      const fin = pose.fin;
      if (Math.abs(fin - shownFin) > 0.002) applyView(fin);
      if (pose.index !== lastIndex) {
        lastIndex = pose.index;
        setActive(pose.index);
      }
      const t = clock.elapsedTime;
      if (!reduce) {
        mixers.forEach((m) => m.update(dt));
      }
      groups.forEach((g, i) => {
        // each island glides from its place on the tour to its place in the ranking
        base.copy(centres[i]).lerp(finalSpot(rankIndex[i]), fin);
        g.position.copy(base);
        g.rotation.y = (YAW[i] ?? 0) * (1 - fin);
        if (!reduce) {
          g.position.y += Math.sin(t * 0.7 + i * 1.7) * 0.45;
          g.rotation.z = Math.sin(t * 0.45 + i) * 0.012;
          g.rotation.x = Math.cos(t * 0.38 + i) * 0.012;
        }
      });
      fog.near = 70 + 100 * fin;
      fog.far = 170 + 150 * fin;
      const c = centres[Math.min(pose.index, n - 1)].clone().lerp(FC, fin);
      sun.position.set(c.x + 18 + 14 * fin, c.y + 30 + 20 * fin, c.z + 14 + 10 * fin);
      sun.target.position.copy(c);
      const half = 16 + 38 * fin;                          // the sun's shadow box grows to cover the line-up
      if (Math.abs(sun.shadow.camera.right - half) > 0.05) {
        const sc = sun.shadow.camera;
        sc.left = sc.bottom = -half; sc.right = sc.top = half; sc.far = 80 + 120 * fin;
        sc.updateProjectionMatrix();
      }
      if (fin > 0.6 && wide() && size.w >= 1024) {         // captions follow their islands along the row
        groups.forEach((g, i) => {
          const v = g.position.clone().project(camera);
          labels.current[i]?.style.setProperty("--x", `${((v.x * 0.5 + 0.5) * size.w).toFixed(1)}px`);
        });
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", readScroll);
      io.disconnect();
      ro.disconnect();
      mixers.forEach((m) => m.stopAllAction());
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) {
          m.geometry.dispose();
          (Array.isArray(m.material) ? m.material : [m.material]).forEach((x) => x.dispose());
        }
      });
      renderer.dispose();
    };
  }, [houses, n, tour, units, rankIndex]);

  // Jump to an island: scroll to the start of its orbit.
  const go = (i: number) => {
    const sec = section.current;
    if (!sec) return;
    const top = sec.getBoundingClientRect().top + window.scrollY;
    const travel = sec.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (i * (ORBIT + SWEEP) + 0.02) / units * travel, behavior: "smooth" });
  };

  return (
    <section ref={section} aria-label="The four houses" className="relative" style={{ height: `${Math.round(units * VH_PER_UNIT)}vh` }}>
      <div className="sticky top-0 h-svh min-h-[560px] overflow-hidden">
        <canvas
          ref={canvas}
          role="img"
          aria-label={houses[active] ? `${houses[active].name} island` : "The four islands, ranked by house points"}
          className="clan-canvas absolute inset-0 size-full"
          data-ready={ready}
        />
        {!ready && (
          <p className="absolute inset-x-0 top-1/3 text-center text-sm font-semibold text-muted" role="status">
            Loading the islands…
          </p>
        )}

        <nav aria-label="Houses" data-finale={active === n} className="clan-rail absolute inset-x-0 bottom-5 z-20 mx-auto flex w-fit gap-2 rounded-full p-1.5 lg:inset-x-auto lg:bottom-0 lg:left-5 lg:top-0 lg:my-auto lg:h-fit lg:flex-col lg:rounded-3xl">
          {houses.map((h, i) => (
            <button
              key={h.id}
              type="button"
              onClick={() => go(i)}
              aria-current={active === i ? "true" : undefined}
              className="flex items-center gap-2.5 rounded-full p-1 lg:pr-3"
            >
              <Image src={h.crest} alt="" width={36} height={36} className="size-9 rounded-full" />
              <span className="hidden text-sm font-semibold lg:inline">{h.name}</span>
              <span className="sr-only lg:hidden">{h.name}</span>
            </button>
          ))}
        </nav>

        <div data-on={active === n} aria-hidden={active !== n} className="finale-head absolute inset-x-4 top-20 z-10 text-center">
          <h3 className="font-crest text-3xl font-bold sm:text-4xl">How the houses stand</h3>
          <p className="mx-auto mt-1 max-w-md text-muted">Ranked by points earned across the alliance.</p>
        </div>
        <ol data-on={active === n} aria-label="Houses by points" className="finale-cards absolute inset-x-3 bottom-4 z-10 grid grid-cols-2 gap-2 sm:gap-3 lg:inset-x-0 lg:bottom-[9vh] lg:block">
          {order.map((i) => {
            const h = houses[i];
            return (
              <li
                key={h.id}
                ref={(node) => { labels.current[i] = node; }}
                className="finale-card"
                style={{ ["--house" as string]: h.color, ["--on-house" as string]: h.onColor }}
              >
                <Image src={h.crest} alt="" width={48} height={48} className="hidden size-12 shrink-0 sm:block" />
                <div className="min-w-0 flex-1">
                  <p className="font-crest text-base font-bold leading-tight sm:text-xl">{h.name}</p>
                  {h.points !== undefined && (
                    <p className="tabular text-sm text-muted">
                      <span className="font-bold text-ink">{fmt(h.points)}</span> points
                      <span className="hidden sm:inline"> · {fmt(h.members ?? 0)} {h.members === 1 ? "student" : "students"}</span>
                    </p>
                  )}
                </div>
                {h.rank !== undefined && <span className="rank-badge size-8 text-sm sm:size-11 sm:text-base" aria-label={`Rank ${h.rank}`}>#{h.rank}</span>}
              </li>
            );
          })}
        </ol>

        {houses.map((h, i) => (
          <div
            key={h.id}
            data-active={active === i}
            aria-hidden={active !== i}
            className="clan-card absolute inset-x-4 bottom-20 z-10 sm:inset-x-auto sm:right-6 sm:w-[26rem] lg:right-[max(1.5rem,calc((100vw-80rem)/2))] lg:top-0 lg:bottom-0 lg:my-auto lg:h-fit lg:w-[min(30rem,32vw)]"
          >
            {h.card}
          </div>
        ))}
      </div>
    </section>
  );
}
