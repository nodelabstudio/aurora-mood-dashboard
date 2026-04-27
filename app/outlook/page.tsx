import { headers } from "next/headers";
import Link from "next/link";
import {
  ArrowLeft,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from "@phosphor-icons/react/dist/ssr";

import {
  fetchWeather,
  geocodeCity,
  type Condition,
  type WeatherSnapshot,
} from "@/lib/weather";
import { pickTimeBand } from "@/lib/scene-picker";
import SceneBackground from "@/components/scene/SceneBackground";

const DEFAULT = { lat: 64.1466, lon: -21.9426 };

type SearchParams = Promise<{ city?: string }>;

export default async function OutlookPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const h = await headers();

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
    /* fall through to defaults */
  }

  let snapshot: WeatherSnapshot | null = null;
  try {
    snapshot = await fetchWeather(lat, lon);
  } catch {
    snapshot = null;
  }

  if (!snapshot) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-8">
        <p className="text-white/55 text-sm font-mono">
          Outlook unavailable — check OPENWEATHER_API_KEY in .env.local.
        </p>
      </main>
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const band = pickTimeBand(now, snapshot.current.sunrise, snapshot.current.sunset);

  // Range for the temp bar — week's lowest min to week's highest max
  const allMins = snapshot.daily.map((d) => d.tempMin);
  const allMaxs = snapshot.daily.map((d) => d.tempMax);
  const weekMin = Math.min(...allMins);
  const weekMax = Math.max(...allMaxs);
  const span = Math.max(1, weekMax - weekMin);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden text-white/95">
      <SceneBackground condition={snapshot.current.condition} timeBand={band} />

      <div className="relative z-10 mx-auto max-w-2xl flex flex-col gap-6 p-6 md:p-10 min-h-[100dvh]">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.3em] font-mono text-white/70 hover:text-white transition"
          >
            <ArrowLeft size={14} weight="regular" strokeWidth={1.5} />
            back
          </Link>
          <p className="text-[0.7rem] uppercase tracking-[0.32em] font-mono text-white/55">
            {cityHint ?? snapshot.city}
            {snapshot.country ? ` · ${snapshot.country}` : ""}
          </p>
        </header>

        <h1 className="text-4xl md:text-5xl font-extralight tracking-tighter">
          The days <span className="text-white/45 italic font-serif">ahead</span>
        </h1>

        <ol className="flex flex-col gap-2 mt-2">
          {snapshot.daily.map((day, i) => (
            <li key={day.time}>
              <div className="glass-panel outlook-row flex items-center gap-4">
                <div className="w-16 shrink-0">
                  <p className="text-sm font-medium">
                    {i === 0 ? "Today" : formatDay(day.time, snapshot.current.timezoneOffset)}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-[0.2em] font-mono text-white/45">
                    {formatDate(day.time, snapshot.current.timezoneOffset)}
                  </p>
                </div>

                <div className="w-9 shrink-0 text-white/85">
                  <ConditionIcon condition={day.condition} />
                </div>

                <p className="hidden sm:block flex-1 text-sm text-white/65 capitalize truncate">
                  {conditionLabel(day.condition)}
                </p>

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-[0.7rem] font-mono tabular-nums text-white/55 w-7 text-right">
                    {Math.round(day.tempMin)}°
                  </span>
                  <TempBar
                    dayMin={day.tempMin}
                    dayMax={day.tempMax}
                    weekMin={weekMin}
                    span={span}
                  />
                  <span className="text-[0.7rem] font-mono tabular-nums text-white/95 w-7">
                    {Math.round(day.tempMax)}°
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

function TempBar({
  dayMin,
  dayMax,
  weekMin,
  span,
}: {
  dayMin: number;
  dayMax: number;
  weekMin: number;
  span: number;
}) {
  const left = ((dayMin - weekMin) / span) * 100;
  const width = ((dayMax - dayMin) / span) * 100;
  return (
    <div className="relative w-24 sm:w-32 h-1 rounded-full bg-white/10">
      <div
        className="absolute h-full rounded-full bg-gradient-to-r from-sky-300/80 via-amber-200/85 to-rose-300/85"
        style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
      />
    </div>
  );
}

function ConditionIcon({ condition }: { condition: Condition }) {
  const props = { size: 22, weight: "regular" as const, strokeWidth: 1.5 };
  switch (condition) {
    case "clear":
      return <Sun {...props} />;
    case "partly-cloudy":
      return <CloudSun {...props} />;
    case "overcast":
      return <CloudFog {...props} />;
    case "rain":
      return <CloudRain {...props} />;
    case "snow":
      return <CloudSnow {...props} />;
    case "thunderstorm":
      return <CloudLightning {...props} />;
    default:
      return <Cloud {...props} />;
  }
}

function conditionLabel(c: Condition): string {
  return c.replace("-", " ");
}

function formatDay(unix: number, tzOffsetSeconds: number): string {
  const d = new Date((unix + tzOffsetSeconds) * 1000);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()]!;
}

function formatDate(unix: number, tzOffsetSeconds: number): string {
  const d = new Date((unix + tzOffsetSeconds) * 1000);
  const month = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ][d.getUTCMonth()]!;
  return `${month} ${d.getUTCDate()}`;
}
