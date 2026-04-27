"use client";

import { useEffect, useState } from "react";

type Props = {
  imageUrl: string;
};

export default function PaletteStrip({ imageUrl }: Props) {
  const [colors, setColors] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setColors([]);

    const img = document.createElement("img");
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = imageUrl;

    img.onload = () => {
      if (cancelled) return;
      const top = extractDominant(img, 3);
      if (!cancelled) setColors(top);
    };
    img.onerror = () => {
      // Image missing (likely AI scenes not yet generated). Hide the strip.
      if (!cancelled) setColors([]);
    };

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  if (colors.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(c);
              setCopied(c);
              setTimeout(() => setCopied((cur) => (cur === c ? null : cur)), 1200);
            } catch {
              /* clipboard refused; silent */
            }
          }}
          className="group relative size-5 rounded-full ring-1 ring-white/30 transition hover:ring-white/60 hover:scale-110 active:scale-95"
          style={{ backgroundColor: c }}
          aria-label={`Copy ${c}`}
        >
          <span
            className={`absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-mono tracking-wide backdrop-blur-md transition-opacity ${
              copied === c
                ? "opacity-100 text-white"
                : "opacity-0 group-hover:opacity-100 text-white/85"
            }`}
          >
            {copied === c ? "copied" : c}
          </span>
        </button>
      ))}
    </div>
  );
}

// Coarse 4-bit-per-channel histogram with skin/black/white pixel skipping.
// Plenty for surfacing the three feel-of-the-scene colors; not a full
// median-cut clusterer.
function extractDominant(img: HTMLImageElement, count: number): string[] {
  const W = 80;
  const H = 50;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(img, 0, 0, W, H);
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, W, H).data;
  } catch {
    // Cross-origin tainted canvas — bail out silently.
    return [];
  }

  const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max < 24 || min > 232) continue; // skip near-black and near-white
    const key = `${r >> 4}-${g >> 4}-${b >> 4}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count += 1;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const top = [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, count);

  return top.map((bucket) => {
    const r = Math.round(bucket.r / bucket.count);
    const g = Math.round(bucket.g / bucket.count);
    const b = Math.round(bucket.b / bucket.count);
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  });
}
