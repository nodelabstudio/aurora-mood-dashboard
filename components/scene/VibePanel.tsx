"use client";

import { useEffect, useState } from "react";
import GlassPanel from "./GlassPanel";

type Props = {
  city: string;
  condition: string;
  temp: number;
  hour: number;
};

type State =
  | { kind: "loading" }
  | { kind: "ready"; vibe: string }
  | { kind: "unavailable" };

export default function VibePanel({ city, condition, temp, hour }: Props) {
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const ac = new AbortController();
    setState({ kind: "loading" });

    fetch("/api/vibe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, condition, temp, hour }),
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((data: { vibe?: string; error?: string }) => {
        if (data.vibe) setState({ kind: "ready", vibe: data.vibe });
        else setState({ kind: "unavailable" });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ kind: "unavailable" });
      });

    return () => ac.abort();
  }, [city, condition, temp, hour]);

  return (
    <GlassPanel className="vibe-panel" depth={2} index={1}>
      <p className="text-[0.65rem] uppercase tracking-[0.32em] text-white/45 font-mono">
        today&apos;s vibe
      </p>

      {state.kind === "loading" && <VibeSkeleton />}

      {state.kind === "ready" && (
        <p className="font-serif text-lg md:text-xl leading-[1.55] text-white/85 italic mt-2">
          {state.vibe}
        </p>
      )}

      {state.kind === "unavailable" && (
        <p className="font-serif text-base leading-relaxed text-white/55 italic mt-2">
          The narrator is quiet right now. Configure GROQ_API_KEY (and
          UPSTASH_REDIS_REST_URL/TOKEN) in <span className="font-mono not-italic">.env.local</span> to hear today&apos;s vibe.
        </p>
      )}
    </GlassPanel>
  );
}

function VibeSkeleton() {
  return (
    <div className="mt-3 space-y-2.5" aria-hidden>
      <div className="h-4 w-full shimmer" />
      <div className="h-4 w-[88%] shimmer" />
      <div className="h-4 w-[94%] shimmer" />
      <div className="h-4 w-[60%] shimmer" />
    </div>
  );
}
