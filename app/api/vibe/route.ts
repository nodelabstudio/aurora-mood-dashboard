import { NextRequest, NextResponse } from "next/server";
import { generateVibe, GroqRateLimitError, type VibeInput } from "@/lib/groq";
import { generateVibeFallback } from "@/lib/openrouter";
import { checkLimits } from "@/lib/ratelimit";
import { getCachedVibe, setCachedVibe } from "@/lib/cache";

function getIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isVibeInput(x: unknown): x is VibeInput {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.city === "string" &&
    typeof o.condition === "string" &&
    typeof o.temp === "number" &&
    typeof o.hour === "number"
  );
}

export async function POST(req: NextRequest) {
  const ip = getIp(req);

  const limit = await checkLimits(ip).catch(() => ({ ok: true as const }));
  if (!limit.ok) {
    return NextResponse.json(
      { error: "rate_limited", reason: limit.reason },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!isVibeInput(body)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  // hour-bucket = whole-hour integer; same context within the hour returns cached
  const hourBucket = Math.floor(body.hour);

  const cached = await getCachedVibe(body.city, body.condition, hourBucket).catch(() => null);
  if (cached) {
    return NextResponse.json({ vibe: cached, cached: true });
  }

  let vibe: string;
  try {
    vibe = await generateVibe(body);
  } catch (err) {
    if (err instanceof GroqRateLimitError) {
      vibe = await generateVibeFallback(body);
    } else {
      const message = err instanceof Error ? err.message : "unknown";
      return NextResponse.json({ error: "vibe_failed", message }, { status: 500 });
    }
  }

  setCachedVibe(body.city, body.condition, hourBucket, vibe).catch(() => undefined);

  return NextResponse.json({ vibe, cached: false });
}
