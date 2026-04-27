import { headers } from "next/headers";
import Link from "next/link";
import { Compass } from "@phosphor-icons/react/dist/ssr";

import { fetchWeather, geocodeCity, type WeatherSnapshot } from "@/lib/weather";
import { pickTimeBand, pickScene } from "@/lib/scene-picker";

import SceneBackground from "@/components/scene/SceneBackground";
import NowCard from "@/components/scene/NowCard";
import HourlyStrip from "@/components/scene/HourlyStrip";
import VibePanel from "@/components/scene/VibePanel";
import PaletteStrip from "@/components/scene/PaletteStrip";
import ShareButton from "@/components/share/ShareButton";

// Default — Reykjavík. Latitude high enough to get interesting daylight cycles
// when testing time-of-day bands, and tonally on-brand for the project name.
const DEFAULT = { lat: 64.1466, lon: -21.9426, label: "Reykjavík" };

type SearchParams = Promise<{ city?: string }>;

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const h = await headers();

  // Resolve location: ?city → forward-geocode; else Vercel IP geo; else default.
  let lat = DEFAULT.lat;
  let lon = DEFAULT.lon;
  let cityHint: string | undefined;

  try {
    if (sp.city) {
      const geo = await geocodeCity(sp.city);
      if (geo) {
        lat = geo.lat;
        lon = geo.lon;
        cityHint = geo.city;
      }
    } else {
      const headerLat = parseFloat(h.get("x-vercel-ip-latitude") ?? "");
      const headerLon = parseFloat(h.get("x-vercel-ip-longitude") ?? "");
      const headerCity = h.get("x-vercel-ip-city");
      if (!Number.isNaN(headerLat) && !Number.isNaN(headerLon)) {
        lat = headerLat;
        lon = headerLon;
        if (headerCity) cityHint = decodeURIComponent(headerCity);
      }
    }
  } catch {
    // Geocoding/header failure is non-fatal — fall through to defaults.
  }

  let snapshot: WeatherSnapshot | null = null;
  let setupError: string | null = null;
  try {
    snapshot = await fetchWeather(lat, lon);
  } catch (err) {
    setupError = err instanceof Error ? err.message : "Could not load weather";
  }

  if (!snapshot) {
    return <SetupRequired error={setupError} />;
  }

  const now = Math.floor(Date.now() / 1000);
  const band = pickTimeBand(now, snapshot.current.sunrise, snapshot.current.sunset);
  const scene = pickScene(snapshot.current.condition, band);
  const localHour = new Date(
    (now + snapshot.current.timezoneOffset) * 1000,
  ).getUTCHours();

  return (
    <main className="relative min-h-[100dvh] overflow-hidden text-white/95">
      <SceneBackground condition={snapshot.current.condition} timeBand={band} />

      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-10 min-h-[100dvh]">
        <header className="flex items-center justify-between">
          <p className="text-[0.7rem] uppercase tracking-[0.4em] font-mono text-white/70">
            aurora
          </p>
          <p className="text-[0.7rem] uppercase tracking-[0.32em] font-mono text-white/55">
            {cityHint ?? snapshot.city}
            {snapshot.country ? ` · ${snapshot.country}` : ""}
          </p>
        </header>

        <div className="grid grid-cols-12 gap-4 md:gap-6 flex-1 items-start">
          <div className="col-span-12 lg:col-span-7 self-start">
            <NowCard
              city={cityHint ?? snapshot.city}
              country={snapshot.country}
              temp={snapshot.current.temp}
              feelsLike={snapshot.current.feelsLike}
              condition={snapshot.current.condition}
              conditionRaw={snapshot.current.conditionRaw}
              humidity={snapshot.current.humidity}
              windSpeed={snapshot.current.windSpeed}
              sunrise={snapshot.current.sunrise}
              sunset={snapshot.current.sunset}
              timezoneOffset={snapshot.current.timezoneOffset}
            />
          </div>

          <div className="col-span-12 lg:col-span-5 self-start lg:mt-12">
            <VibePanel
              city={cityHint ?? snapshot.city}
              condition={snapshot.current.condition}
              temp={snapshot.current.temp}
              hour={localHour}
            />
          </div>
        </div>

        <div className="mt-auto">
          <HourlyStrip
            hours={snapshot.hourly}
            timezoneOffset={snapshot.current.timezoneOffset}
            sunrise={snapshot.current.sunrise}
            sunset={snapshot.current.sunset}
          />
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-20 flex items-center gap-3 md:gap-4">
        <PaletteStrip imageUrl={`/scenes/${scene}.webp`} />
        <Link
          href="/outlook"
          className="inline-flex items-center justify-center size-9 rounded-full border border-white/15 bg-white/[0.06] text-white/80 backdrop-blur-md transition hover:bg-white/[0.12] hover:text-white active:translate-y-[1px]"
          aria-label="7-day outlook"
        >
          <Compass size={16} weight="regular" strokeWidth={1.5} />
        </Link>
        <ShareButton />
      </div>
    </main>
  );
}

function SetupRequired({ error }: { error: string | null }) {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden flex items-center justify-center p-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,#1a2542_0%,#08090d_60%)]" />
      <div className="glass-panel max-w-lg">
        <p className="text-[0.65rem] uppercase tracking-[0.32em] text-white/45 font-mono">
          setup required
        </p>
        <h1 className="mt-3 text-3xl tracking-tighter font-light">
          Aurora needs a key.
        </h1>
        <p className="mt-3 text-white/70 leading-relaxed">
          The OpenWeatherMap key is missing or rejected, so the scene can&apos;t
          assemble. Add{" "}
          <span className="font-mono text-white/90">OPENWEATHER_API_KEY</span>{" "}
          to <span className="font-mono text-white/90">.env.local</span> and
          reload.
        </p>
        {error && (
          <pre className="mt-4 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-3 font-mono text-[11px] text-red-200/80">
            {error}
          </pre>
        )}
        <p className="mt-5 text-xs text-white/45">
          See <span className="font-mono">.env.local.example</span> for all
          variables.
        </p>
      </div>
    </main>
  );
}
