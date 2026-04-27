import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from "@phosphor-icons/react/dist/ssr";
import GlassPanel from "./GlassPanel";
import type { Condition, HourlyPoint } from "@/lib/weather";

type Props = {
  hours: HourlyPoint[];
  timezoneOffset: number;
  // sunrise/sunset for the *current day* (in unix seconds, UTC). Used to
  // pick a sun-or-moon icon for "clear"/"partly-cloudy" hours.
  sunrise: number;
  sunset: number;
};

export default function HourlyStrip({ hours, timezoneOffset, sunrise, sunset }: Props) {
  return (
    <GlassPanel className="hourly-strip" depth={1} index={3}>
      <ol
        className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Hourly forecast"
      >
        {hours.map((h, i) => {
          const isDaytime = h.time >= sunrise && h.time < sunset;
          return (
            <li
              key={h.time}
              className="snap-start shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2 min-w-[4rem]"
            >
              <span className="text-[0.65rem] uppercase tracking-[0.18em] font-mono text-white/55">
                {i === 0 ? "now" : formatHour(h.time, timezoneOffset)}
              </span>
              <span className="text-white/85">
                <ConditionIcon condition={h.condition} day={isDaytime} />
              </span>
              <span className="text-sm font-mono tabular-nums text-white/95">
                {Math.round(h.temp)}°
              </span>
            </li>
          );
        })}
      </ol>
    </GlassPanel>
  );
}

function ConditionIcon({ condition, day }: { condition: Condition; day: boolean }) {
  const props = { size: 18, weight: "regular" as const, strokeWidth: 1.5 };
  switch (condition) {
    case "clear":
      return day ? <Sun {...props} /> : <Moon {...props} />;
    case "partly-cloudy":
      return day ? <CloudSun {...props} /> : <Cloud {...props} />;
    case "overcast":
      return <CloudFog {...props} />;
    case "rain":
      return <CloudRain {...props} />;
    case "snow":
      return <CloudSnow {...props} />;
    case "thunderstorm":
      return <CloudLightning {...props} />;
  }
}

function formatHour(unix: number, tzOffsetSeconds: number): string {
  const d = new Date((unix + tzOffsetSeconds) * 1000);
  return `${d.getUTCHours().toString().padStart(2, "0")}h`;
}
