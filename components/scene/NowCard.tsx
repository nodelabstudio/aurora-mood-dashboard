import { Drop, Sun, Wind } from "@phosphor-icons/react/dist/ssr";
import GlassPanel from "./GlassPanel";
import type { Condition } from "@/lib/weather";

type Props = {
  city: string;
  country?: string;
  temp: number;
  feelsLike: number;
  condition: Condition;
  conditionRaw: string;
  humidity: number;
  windSpeed: number;
  sunrise: number;
  sunset: number;
  timezoneOffset: number;
};

const STROKE = 1.5;

export default function NowCard({
  city,
  country,
  temp,
  feelsLike,
  conditionRaw,
  humidity,
  windSpeed,
  sunrise,
  sunset,
  timezoneOffset,
}: Props) {
  return (
    <GlassPanel className="now-card" depth={3} index={0}>
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.32em] text-white/45 font-mono">
            now
          </p>
          <p className="mt-2 text-base font-medium text-white/85">
            {city}
            {country ? <span className="text-white/45">, {country}</span> : null}
          </p>
        </div>
        <p className="text-[0.65rem] uppercase tracking-[0.32em] text-white/45 font-mono">
          {formatLocalTime(timezoneOffset)}
        </p>
      </header>

      <div className="flex items-end justify-between gap-6 mt-2 flex-wrap">
        <div className="leading-none">
          <span className="text-[7.5rem] md:text-[8.5rem] font-extralight tracking-[-0.05em] tabular-nums">
            {Math.round(temp)}
          </span>
          <span className="text-3xl md:text-4xl font-light text-white/55 align-top ml-1">
            °
          </span>
        </div>
        <div className="text-right pb-3 max-w-[40%]">
          <p className="text-sm md:text-base font-light leading-snug text-white/85 capitalize">
            {conditionRaw}
          </p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.3em] text-white/40 font-mono">
            feels {Math.round(feelsLike)}°
          </p>
        </div>
      </div>

      <footer className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-white/10">
        <Detail icon={<Drop size={14} weight="regular" strokeWidth={STROKE} />} label="humidity" value={`${humidity}%`} />
        <Detail icon={<Wind size={14} weight="regular" strokeWidth={STROKE} />} label="wind" value={`${windSpeed.toFixed(1)} m/s`} />
        <Detail
          icon={<Sun size={14} weight="regular" strokeWidth={STROKE} />}
          label="sun"
          value={`${formatTime(sunrise, timezoneOffset)} – ${formatTime(sunset, timezoneOffset)}`}
        />
      </footer>
    </GlassPanel>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-white/50">
        {icon}
        <span className="text-[0.65rem] uppercase tracking-[0.25em] font-mono">
          {label}
        </span>
      </div>
      <p className="mt-1 text-xs md:text-sm text-white/85 truncate font-mono tabular-nums">
        {value}
      </p>
    </div>
  );
}

function formatTime(unix: number, tzOffsetSeconds: number): string {
  const d = new Date((unix + tzOffsetSeconds) * 1000);
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function formatLocalTime(tzOffsetSeconds: number): string {
  const d = new Date(Date.now() + tzOffsetSeconds * 1000);
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}
