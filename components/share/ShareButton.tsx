"use client";

import { useState } from "react";
import { Camera, Spinner } from "@phosphor-icons/react";

type Props = {
  // CSS selector for the element to capture. Defaults to <main>.
  targetSelector?: string;
};

export default function ShareButton({ targetSelector = "main" }: Props) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  async function handleClick() {
    if (state === "busy") return;
    setState("busy");
    try {
      const target = document.querySelector(targetSelector) as HTMLElement | null;
      if (!target) {
        setState("error");
        return;
      }
      // Lazy import — keeps html-to-image (~50KB) out of the initial bundle.
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(target, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#08090d",
      });
      const link = document.createElement("a");
      link.download = `aurora-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
      setState("idle");
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2400);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "busy"}
      className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-[0.65rem] uppercase tracking-[0.28em] font-mono text-white/80 backdrop-blur-md transition hover:bg-white/[0.12] hover:text-white active:translate-y-[1px] disabled:opacity-60"
    >
      {state === "busy" ? (
        <Spinner size={14} weight="regular" strokeWidth={1.5} className="animate-spin" />
      ) : (
        <Camera size={14} weight="regular" strokeWidth={1.5} />
      )}
      <span>{state === "error" ? "try again" : state === "busy" ? "rendering" : "save scene"}</span>
    </button>
  );
}
