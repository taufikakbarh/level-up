// Pixel-art hero rendered from ASCII grids — no image assets.
// Evolves through 5 stages; pose is driven by CSS animation classes.

const PEASANT = [
  "....hhhhhh....",
  "...hhhhhhhh...",
  "...hssssssh...",
  "....sesses....",
  "....ssssss....",
  ".....ssss.....",
  "...tttttttt...",
  "..tttttttttt..",
  "..s.tttttt.s..",
  "...tttttttt...",
  "...dddddddd...",
  "....tt..tt....",
  "....ll..ll....",
  "....ll..ll....",
  "....bb..bb....",
  "...bbb..bbb...",
];

const SQUIRE = [
  "....hhhhhh....",
  "...hhhhhhhh...",
  "...hssssssh...",
  "....sesses..w.",
  "....ssssss..w.",
  ".....ssss...w.",
  "...tttttttt.w.",
  "..ttttttttttw.",
  "..s.tttttt.sW.",
  "...tttttttt.W.",
  "...dddddddd...",
  "....tt..tt....",
  "....ll..ll....",
  "....ll..ll....",
  "....bb..bb....",
  "...bbb..bbb...",
];

const KNIGHT = [
  "....mmmmmm....",
  "...mmmmmmmm...",
  "...mssssssm...",
  "....sesses..w.",
  "....ssssss..w.",
  ".....mmmm...w.",
  "...mmmmmmmm.w.",
  "SSmmmmmmmmmmw.",
  "SSSmmmmmmm.sW.",
  "SSSmmmmmmmm.W.",
  "SS.gggggggg...",
  "....mm..mm....",
  "....ll..ll....",
  "....ll..ll....",
  "....bb..bb....",
  "...bbb..bbb...",
];

const CHAMPION = [
  "....pppppp....",
  "...mmmmmmmm...",
  "...mssssssm...",
  "....sesses..w.",
  "....ssssss..w.",
  ".....gggg...w.",
  "..ccmmmmmm..w.",
  ".ccmmmmmmmmmw.",
  ".ccmmmmmmm.sW.",
  ".ccmmmmmmmm.W.",
  ".ccgggggggg...",
  ".cc.mm..mm....",
  ".cc.ll..ll....",
  "....ll..ll....",
  "....bb..bb....",
  "...bbb..bbb...",
];

const GRIDS = { 1: PEASANT, 2: SQUIRE, 3: KNIGHT, 4: CHAMPION, 5: CHAMPION };

const BASE = { s: "#e8b88a", e: "#161a23", b: "#4a3826", l: "#2b2f3d" };

const PALETTES = {
  1: { ...BASE, h: "#6b4a2f", t: "#8a6a45", d: "#5d4630" },
  2: { ...BASE, h: "#6b4a2f", t: "#a07444", d: "#6e4e2e", w: "#cfd8e3", W: "#6e4e2e" },
  3: { ...BASE, m: "#9aa7b8", g: "#f5c842", S: "#7a4f2a", w: "#dfe7f0", W: "#c9a23a" },
  4: { ...BASE, m: "#aab6c8", g: "#f5c842", c: "#7c3aed", p: "#ef4444", w: "#e8eef6", W: "#f5c842" },
  5: { ...BASE, m: "#f5c842", g: "#fff3c4", c: "#4c1d95", p: "#ffffff", w: "#ffe9a8", W: "#b45309", l: "#3a2f55", b: "#2a2040" },
};

const SPARKLES = [
  { left: "-8%",  top: "12%", delay: "0s"    },
  { left: "92%",  top: "4%",  delay: "0.5s"  },
  { left: "100%", top: "55%", delay: "0.9s"  },
  { left: "-12%", top: "65%", delay: "1.3s"  },
];

export default function HeroAvatar({ stage = 1, pose = "idle", size = 72 }) {
  const s = Math.max(1, Math.min(5, stage));
  const grid = GRIDS[s];
  const palette = PALETTES[s];
  const height = size * (grid.length / grid[0].length);

  const aura = s === 5 ? "hero-aura-legend" : s === 4 ? "hero-aura" : "";

  return (
    <div className="relative inline-block shrink-0" style={{ width: size, height }}>
      <svg
        viewBox={`0 0 ${grid[0].length} ${grid.length}`}
        width={size}
        height={height}
        shapeRendering="crispEdges"
        className={`hero-pose-${pose} ${aura}`}
      >
        {grid.flatMap((row, y) =>
          row.split("").map((ch, x) => {
            const fill = palette[ch];
            if (!fill) return null;
            return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />;
          })
        )}
      </svg>
      {s === 5 &&
        SPARKLES.map((sp, i) => (
          <span key={i} className="hero-sparkle" style={{ left: sp.left, top: sp.top, animationDelay: sp.delay }}>
            ✦
          </span>
        ))}
    </div>
  );
}
