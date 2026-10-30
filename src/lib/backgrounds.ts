// Animated backgrounds: original, dependency-free effects. Each one is a single HTML snippet (markup + style +
// script) generated from a few options, so the live preview runs exactly the code a visitor copies.
//
// Every snippet fills its nearest positioned ancestor (`position: absolute; inset: 0`), sits behind the content
// (`z-index: 0`), honours `prefers-reduced-motion` (one still frame) and pauses when off screen or in a hidden tab.

export type BackgroundOptions = {
  /** Three accent colors, hex. */
  colors: [string, string, string];
  /** Base background, hex. */
  background: string;
  /** 0.25 (slow) to 2 (fast); 1 is the designed pace. */
  speed: number;
};

export type BackgroundEffect = {
  id: string;
  name: string;
  description: string;
  /** Where it reads best, used in the copy-paste prompt. */
  bestFor: string;
  kind: "CSS" | "Canvas";
  defaults: BackgroundOptions;
  code: (o: BackgroundOptions) => string;
};

const reduced = "@media (prefers-reduced-motion: reduce) { #ID, #ID *, #ID::before { animation: none !important; } }";

/** Shared runtime for canvas effects: sizing, DPR, visibility pausing and reduced motion. */
const canvasRuntime = (id: string, setup: string, frame: string, o: BackgroundOptions) => `<div id="${id}" style="position:absolute;inset:0;overflow:hidden;z-index:0;background:${o.background}" aria-hidden="true"><canvas style="display:block;width:100%;height:100%"></canvas></div>
<script>
(() => {
  const root = document.getElementById("${id}");
  const canvas = root.querySelector("canvas");
  const ctx = canvas.getContext("2d");
  const colors = ${JSON.stringify(o.colors)};
  const speed = ${o.speed};
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0, h = 0, t = 0, last = 0, raf = 0, onScreen = true;
  const hexToRgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
${setup}
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = root.clientWidth; h = root.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (typeof onResize === "function") onResize();
    draw();
  };
  const draw = () => {
${frame}
  };
  const loop = (now) => {
    t += Math.min(now - (last || now), 50) / 1000 * speed; last = now;
    draw();
    raf = requestAnimationFrame(loop);
  };
  const run = () => { cancelAnimationFrame(raf); last = 0; if (!still && onScreen && !document.hidden) raf = requestAnimationFrame(loop); };
  new ResizeObserver(resize).observe(root);
  new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); }).observe(root);
  document.addEventListener("visibilitychange", run);
  resize(); run();
})();
</script>`;

export const BACKGROUNDS: BackgroundEffect[] = [
  {
    id: "aurora",
    name: "Aurora",
    description: "Three soft glows drifting and blending over a dark base, like light behind frosted glass.",
    bestFor: "a dark hero section or a product launch banner",
    kind: "CSS",
    defaults: { colors: ["#7c3aed", "#ec4899", "#06b6d4"], background: "#0b0b1a", speed: 1 },
    code: (o) => {
      const d = (s: number) => `${(s / o.speed).toFixed(1)}s`;
      return `<div id="cr-aurora" aria-hidden="true">
  <span></span><span></span><span></span>
</div>
<style>
  #cr-aurora { position: absolute; inset: 0; overflow: hidden; z-index: 0; background: ${o.background}; }
  #cr-aurora span { position: absolute; width: 60%; aspect-ratio: 1; border-radius: 50%; filter: blur(70px); opacity: .75; mix-blend-mode: screen; }
  #cr-aurora span:nth-child(1) { background: ${o.colors[0]}; left: -10%; top: -25%; animation: cr-aurora-a ${d(18)} ease-in-out infinite alternate; }
  #cr-aurora span:nth-child(2) { background: ${o.colors[1]}; right: -15%; top: 5%; animation: cr-aurora-b ${d(22)} ease-in-out infinite alternate; }
  #cr-aurora span:nth-child(3) { background: ${o.colors[2]}; left: 20%; bottom: -40%; animation: cr-aurora-c ${d(26)} ease-in-out infinite alternate; }
  @keyframes cr-aurora-a { to { transform: translate(25%, 20%) scale(1.15); } }
  @keyframes cr-aurora-b { to { transform: translate(-20%, 15%) scale(.9); } }
  @keyframes cr-aurora-c { to { transform: translate(15%, -25%) scale(1.2); } }
  ${reduced.replaceAll("ID", "cr-aurora")}
</style>`;
    },
  },
  {
    id: "mesh",
    name: "Mesh Drift",
    description: "Layered radial gradients sliding past each other — a slow, living mesh gradient on a light base.",
    bestFor: "a light SaaS hero or a pricing section",
    kind: "CSS",
    defaults: { colors: ["#93c5fd", "#fbcfe8", "#fde68a"], background: "#f8fafc", speed: 1 },
    code: (o) => `<div id="cr-mesh" aria-hidden="true"></div>
<style>
  #cr-mesh {
    position: absolute; inset: 0; overflow: hidden; z-index: 0;
    background:
      radial-gradient(40% 50% at 20% 30%, ${o.colors[0]} 0%, transparent 70%),
      radial-gradient(35% 45% at 80% 20%, ${o.colors[1]} 0%, transparent 70%),
      radial-gradient(45% 55% at 60% 85%, ${o.colors[2]} 0%, transparent 70%),
      ${o.background};
    background-size: 200% 200%;
    animation: cr-mesh ${(20 / o.speed).toFixed(1)}s ease-in-out infinite alternate;
  }
  @keyframes cr-mesh {
    0% { background-position: 0% 0%, 100% 0%, 50% 100%, 0 0; }
    50% { background-position: 40% 30%, 60% 40%, 20% 60%, 0 0; }
    100% { background-position: 100% 60%, 0% 80%, 80% 20%, 0 0; }
  }
  ${reduced.replaceAll("ID", "cr-mesh")}
</style>`,
  },
  {
    id: "dot-wave",
    name: "Dot Wave",
    description: "A calm grid of dots that swell and glow as a wave passes through — technical, precise, quiet.",
    bestFor: "a developer-tool or API product hero",
    kind: "Canvas",
    defaults: { colors: ["#22d3ee", "#6366f1", "#a855f7"], background: "#05070d", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-dot-wave",
        `  const gap = 22;
  const rgb = colors.map(hexToRgb);
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));`,
        `    ctx.clearRect(0, 0, w, h);
    for (let y = gap / 2; y < h; y += gap) {
      for (let x = gap / 2; x < w; x += gap) {
        const wave = Math.sin(x * 0.012 + t * 1.6) * Math.cos(y * 0.018 - t * 1.1);
        const k = (wave + 1) / 2;
        const c = k < 0.5 ? mix(rgb[0], rgb[1], k * 2) : mix(rgb[1], rgb[2], (k - 0.5) * 2);
        ctx.fillStyle = "rgba(" + c.join(",") + "," + (0.15 + k * 0.75) + ")";
        ctx.beginPath();
        ctx.arc(x, y, 0.8 + k * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }`,
        o,
      ),
  },
  {
    id: "flow-lines",
    name: "Flow Lines",
    description: "Stacked sine lines flowing sideways at different depths, like fabric moving in a breeze.",
    bestFor: "a fintech or data product hero",
    kind: "Canvas",
    defaults: { colors: ["#38bdf8", "#818cf8", "#f472b6"], background: "#0a0f1f", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-flow-lines",
        `  const lines = 18;`,
        `    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < lines; i++) {
      const k = i / (lines - 1);
      const color = colors[Math.min(2, Math.floor(k * 3))];
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.25 + 0.55 * Math.sin(k * Math.PI);
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = h * (0.25 + k * 0.5)
          + Math.sin(x * 0.006 + t * 0.9 + i * 0.35) * h * 0.08
          + Math.sin(x * 0.013 - t * 0.6 + i * 0.2) * h * 0.03;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;`,
        o,
      ),
  },
  {
    id: "constellation",
    name: "Constellation",
    description: "Slow-drifting points that link up when they pass close — a network that is always rearranging.",
    bestFor: "an AI, infrastructure or network product section",
    kind: "Canvas",
    defaults: { colors: ["#e0e7ff", "#a5b4fc", "#67e8f9"], background: "#0b1020", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-constellation",
        `  let points = [];
  const onResize = () => {
    const count = Math.round(Math.min(110, (w * h) / 9000));
    points = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18,
      c: colors[i % 3],
    }));
  };
  let prev = 0;`,
        `    const dt = Math.min(t - prev, 0.05); prev = t;
    ctx.clearRect(0, 0, w, h);
    const reach = 120;
    for (const p of points) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }
    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const a = points[i], b = points[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < reach) {
          ctx.strokeStyle = a.c;
          ctx.globalAlpha = (1 - d / reach) * 0.5;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
    for (const p of points) { ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill(); }`,
        o,
      ),
  },
  {
    id: "grain-gradient",
    name: "Grain Gradient",
    description: "A slowly turning three-color gradient under a fine film grain — warm, tactile, editorial.",
    bestFor: "a creative studio, portfolio or editorial hero",
    kind: "CSS",
    defaults: { colors: ["#f97316", "#db2777", "#7c3aed"], background: "#1a0b16", speed: 1 },
    code: (o) => `<div id="cr-grain" aria-hidden="true"><span></span></div>
<style>
  #cr-grain { position: absolute; inset: 0; overflow: hidden; z-index: 0; background: ${o.background}; }
  #cr-grain::before {
    content: ""; position: absolute; inset: -50%;
    background: conic-gradient(from 0deg at 50% 50%, ${o.colors[0]}, ${o.colors[1]}, ${o.colors[2]}, ${o.colors[0]});
    filter: blur(60px); opacity: .85;
    animation: cr-grain-turn ${(30 / o.speed).toFixed(1)}s linear infinite;
  }
  #cr-grain span {
    position: absolute; inset: 0; opacity: .22; mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  @keyframes cr-grain-turn { to { transform: rotate(360deg); } }
  ${reduced.replaceAll("ID", "cr-grain")}
</style>`,
  },
  {
    id: "glow-threads",
    name: "Glow Threads",
    description: "Luminous strands that weave across the dark, brightening where they cross — like fibre-optic light.",
    bestFor: "a dark AI or developer-platform hero",
    kind: "Canvas",
    defaults: { colors: ["#22d3ee", "#a78bfa", "#f472b6"], background: "#030712", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-glow-threads",
        `  const threads = 9;`,
        `    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (let i = 0; i < threads; i++) {
      const color = colors[i % 3];
      const phase = i * 0.7;
      const amp = h * (0.18 + 0.12 * Math.sin(t * 0.3 + i));
      const path = () => {
        ctx.beginPath();
        for (let x = -20; x <= w + 20; x += 10) {
          const k = x / w;
          const y = h * 0.5 + Math.sin(k * 5 + t * 0.8 + phase) * amp * Math.sin(k * Math.PI)
            + Math.sin(k * 11 - t * 0.5 + phase * 2) * h * 0.04;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      };
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.12; ctx.lineWidth = 10; path(); ctx.stroke();
      ctx.globalAlpha = 0.35; ctx.lineWidth = 3; path(); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.lineWidth = 1; path(); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";`,
        o,
      ),
  },
  {
    id: "light-beams",
    name: "Light Beams",
    description: "Soft diagonal shafts of light sweeping slowly across the section, like sun through a window.",
    bestFor: "a product launch hero or a landing-page header",
    kind: "CSS",
    defaults: { colors: ["#60a5fa", "#c084fc", "#f9a8d4"], background: "#0b1026", speed: 1 },
    code: (o) => {
      const d = (s: number) => `${(s / o.speed).toFixed(1)}s`;
      return `<div id="cr-beams" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
<style>
  #cr-beams { position: absolute; inset: 0; overflow: hidden; z-index: 0; background: ${o.background}; }
  #cr-beams span {
    position: absolute; top: -50%; height: 200%; width: 18%; filter: blur(28px); opacity: .55;
    transform: rotate(-24deg); mix-blend-mode: screen;
  }
  #cr-beams span:nth-child(1) { left: -20%; background: linear-gradient(transparent, ${o.colors[0]}, transparent); animation: cr-beam ${d(14)} ease-in-out infinite; }
  #cr-beams span:nth-child(2) { left: 10%; width: 10%; background: linear-gradient(transparent, ${o.colors[1]}, transparent); animation: cr-beam ${d(18)} ease-in-out infinite -6s; }
  #cr-beams span:nth-child(3) { left: 40%; width: 24%; background: linear-gradient(transparent, ${o.colors[2]}, transparent); animation: cr-beam ${d(22)} ease-in-out infinite -11s; opacity: .4; }
  #cr-beams span:nth-child(4) { left: 70%; width: 8%; background: linear-gradient(transparent, ${o.colors[0]}, transparent); animation: cr-beam ${d(16)} ease-in-out infinite -3s; }
  @keyframes cr-beam { 0%, 100% { translate: -30% 0; opacity: .25; } 50% { translate: 60% 0; opacity: .65; } }
  ${reduced.replaceAll("ID", "cr-beams")}
</style>`;
    },
  },
  {
    id: "bokeh",
    name: "Bokeh",
    description: "Out-of-focus lights drifting upward and pulsing softly — warm, celebratory, cinematic.",
    bestFor: "an event, music or lifestyle hero",
    kind: "Canvas",
    defaults: { colors: ["#fbbf24", "#f472b6", "#a78bfa"], background: "#120a1c", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-bokeh",
        `  let dots = [];
  const onResize = () => {
    const count = Math.round(Math.min(45, (w * h) / 22000) + 8);
    dots = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * w, y: Math.random() * h, r: 12 + Math.random() * 46,
      v: 6 + Math.random() * 16, p: Math.random() * 6.28, c: hexToRgb(colors[i % 3]),
    }));
  };
  let prev = 0;`,
        `    const dt = Math.min(t - prev, 0.05); prev = t;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (const d of dots) {
      d.y -= d.v * dt;
      if (d.y < -d.r) { d.y = h + d.r; d.x = Math.random() * w; }
      const a = 0.18 + 0.14 * Math.sin(t * 1.3 + d.p);
      const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r);
      g.addColorStop(0, "rgba(" + d.c.join(",") + "," + a + ")");
      g.addColorStop(0.7, "rgba(" + d.c.join(",") + "," + a * 0.6 + ")");
      g.addColorStop(1, "rgba(" + d.c.join(",") + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";`,
        o,
      ),
  },
  {
    id: "plasma",
    name: "Plasma",
    description: "A smooth, slowly morphing field of color — liquid and hypnotic without ever getting busy.",
    bestFor: "a music, gaming or creative-tool hero",
    kind: "Canvas",
    defaults: { colors: ["#1d4ed8", "#9333ea", "#ec4899"], background: "#0a0a14", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-plasma",
        `  // Rendered at low resolution and scaled up: the smoothing is the look, and it stays cheap.
  const small = document.createElement("canvas");
  const sctx = small.getContext("2d");
  const rgb = colors.map(hexToRgb);
  const ramp = (k) => {
    const s = k * 2, i = Math.min(1, Math.floor(s)), f = s - i;
    const a = rgb[i], b = rgb[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };
  let img = null;
  const onResize = () => {
    small.width = 96; small.height = Math.max(24, Math.round(96 * h / Math.max(w, 1)));
    img = sctx.createImageData(small.width, small.height);
  };`,
        `    if (!img) return;
    const sw = small.width, sh = small.height, d = img.data;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const u = x / sw * 6, v = y / sh * 6;
        const n = Math.sin(u + t) + Math.sin(v * 1.3 - t * 0.8) + Math.sin((u + v) * 0.7 + t * 0.6)
          + Math.sin(Math.hypot(u - 3, v - 3) * 1.5 - t * 1.2);
        const c = ramp((n + 4) / 8);
        const p = (y * sw + x) * 4;
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2]; d[p + 3] = 255;
      }
    }
    sctx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(small, 0, 0, w, h);`,
        o,
      ),
  },
  {
    id: "starfield",
    name: "Starfield",
    description: "Stars streaming toward you from the center, tinted in your colors — speed, depth and launch energy.",
    bestFor: "a space, launch or 'get started' section",
    kind: "Canvas",
    defaults: { colors: ["#ffffff", "#93c5fd", "#c4b5fd"], background: "#02030a", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-starfield",
        `  const stars = Array.from({ length: 260 }, (_, i) => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), c: colors[i % 3] }));
  let prev = 0;`,
        `    const dt = Math.min(t - prev, 0.05); prev = t;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, scale = Math.max(w, h) * 0.5;
    for (const s of stars) {
      const pz = s.z;
      s.z -= dt * 0.25;
      if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; continue; }
      const x = cx + (s.x / s.z) * scale, y = cy + (s.y / s.z) * scale;
      const px = cx + (s.x / pz) * scale, py = cy + (s.y / pz) * scale;
      if (x < 0 || x > w || y < 0 || y > h) continue;
      ctx.strokeStyle = s.c;
      ctx.globalAlpha = Math.min(1, (1 - s.z) * 1.4);
      ctx.lineWidth = (1 - s.z) * 2.2 + 0.3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = s.c; ctx.fillRect(x, y, ctx.lineWidth, ctx.lineWidth); // visible even when still
    }
    ctx.globalAlpha = 1;`,
        o,
      ),
  },
  {
    id: "ripple-rings",
    name: "Ripple Rings",
    description: "Rings spreading from random points and fading out, like rain on still water.",
    bestFor: "a calm wellness, finance or productivity section",
    kind: "Canvas",
    defaults: { colors: ["#5eead4", "#38bdf8", "#818cf8"], background: "#04131a", speed: 1 },
    code: (o) =>
      canvasRuntime(
        "cr-ripple-rings",
        `  let ripples = [], next = 0;`,
        `    ctx.clearRect(0, 0, w, h);
    // Seed rings already in progress, so the first (or reduced-motion still) frame is not empty.
    if (!ripples.length && t === 0) {
      for (let i = 0; i < 6; i++) ripples.push({ x: Math.random() * w, y: Math.random() * h, born: -Math.random() * 4, c: colors[i % 3] });
    }
    if (t >= next) {
      ripples.push({ x: Math.random() * w, y: Math.random() * h, born: t, c: colors[Math.floor(Math.random() * 3)] });
      next = t + 0.35 + Math.random() * 0.5;
    }
    const life = 4.5, maxR = Math.max(w, h) * 0.35;
    ripples = ripples.filter((r) => t - r.born < life);
    ctx.lineWidth = 1.4;
    for (const r of ripples) {
      const age = (t - r.born) / life;
      for (let k = 0; k < 3; k++) {
        const a = age - k * 0.08;
        if (a <= 0) continue;
        ctx.strokeStyle = r.c;
        ctx.globalAlpha = (1 - a) * 0.6;
        ctx.beginPath(); ctx.arc(r.x, r.y, a * maxR, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;`,
        o,
      ),
  },
];

/** The page around a snippet for the preview iframe: a full-size positioned box. */
export const previewDocument = (snippet: string) =>
  `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;height:100%}body{position:relative;overflow:hidden}</style></head><body>${snippet}</body></html>`;

/** A prompt the visitor can paste into their AI coding assistant along with the snippet. */
export const agentPrompt = (e: BackgroundEffect, o: BackgroundOptions) =>
  `Add the "${e.name}" animated background (below) behind ${e.bestFor}.
- Put the snippet inside that section and give the section \`position: relative; overflow: hidden\`.
- Keep the section's content above it with \`position: relative; z-index: 1\`.
- Colors: ${o.colors.join(", ")} on ${o.background}. Speed: ${o.speed}×. Adjust them to match our brand if needed.
- Keep text readable: add a subtle overlay or text shadow if contrast is low.
- It already respects prefers-reduced-motion and pauses off screen; keep that behaviour.
${/^Canvas/.test(e.kind) ? "- In React/Next.js, run the <script> part in a useEffect on mount instead of a raw <script> tag.\n" : ""}
\`\`\`html
${e.code(o)}
\`\`\``;
