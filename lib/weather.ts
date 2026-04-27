// OpenWeatherMap free-tier client (2.5 endpoints).
//
// Why 2.5 instead of One Call 3.0:
// 3.0 requires the "One Call by Call" subscription (credit card on file even
// for the free 1k/day quota). 2.5 endpoints below are part of the original
// free tier — basic API key only, no card, no subscription. Trade-offs vs 3.0:
//   - hourly forecast comes in 3-hour buckets (5 days × 8 = 40 entries),
//     not 1-hour. We expose the next 4 buckets ≈ next 12 hours.
//   - free 2.5 has no daily endpoint; we aggregate /forecast by local date,
//     pick the noon-ish entry for each day's icon, take min/max for the bar.
//   - UV index isn't returned (we never displayed it anyway).
//   - AQI still works (air_pollution is unrelated to One Call).
//
// To switch back to 3.0 later, see git history for this file.

export type Condition =
  | "clear"
  | "partly-cloudy"
  | "overcast"
  | "rain"
  | "snow"
  | "thunderstorm";

export type CurrentWeather = {
  temp: number;
  feelsLike: number;
  condition: Condition;
  conditionRaw: string;
  humidity: number;
  windSpeed: number;
  uvi: number; // always 0 on the free 2.5 path
  sunrise: number; // unix seconds
  sunset: number;
  timezoneOffset: number; // seconds
};

export type HourlyPoint = {
  time: number;
  temp: number;
  condition: Condition;
};

export type DailyPoint = {
  time: number;
  tempMin: number;
  tempMax: number;
  condition: Condition;
};

export type WeatherSnapshot = {
  city: string;
  country?: string;
  current: CurrentWeather;
  hourly: HourlyPoint[]; // ~next 12h, 3h intervals (4 entries)
  daily: DailyPoint[]; // up to 5 days
  aqi?: number;
};

const CURRENT = "https://api.openweathermap.org/data/2.5/weather";
const FORECAST = "https://api.openweathermap.org/data/2.5/forecast";
const AIR = "https://api.openweathermap.org/data/2.5/air_pollution";
const REVERSE_GEO = "https://api.openweathermap.org/geo/1.0/reverse";
const FORWARD_GEO = "https://api.openweathermap.org/geo/1.0/direct";

function key(): string {
  const k = process.env.OPENWEATHER_API_KEY;
  if (!k) throw new Error("OPENWEATHER_API_KEY is not set");
  return k;
}

type OWMCurrent = {
  weather: { id: number; main: string; description: string }[];
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
  };
  wind: { speed: number; deg: number };
  sys: { country: string; sunrise: number; sunset: number };
  name: string;
  timezone: number;
  dt: number;
};

type OWMForecastEntry = {
  dt: number;
  main: { temp: number; temp_min: number; temp_max: number; feels_like: number; humidity: number };
  weather: { id: number }[];
  dt_txt: string;
};

type OWMForecast = {
  list: OWMForecastEntry[];
  city: {
    name: string;
    country: string;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
};

type OWMReverseGeo = { name: string; country: string; state?: string }[];
type OWMForwardGeo = { name: string; country: string; lat: number; lon: number; state?: string }[];
type OWMAir = { list: { main: { aqi: 1 | 2 | 3 | 4 | 5 } }[] };

export async function fetchWeather(lat: number, lon: number): Promise<WeatherSnapshot> {
  const appid = key();
  const baseParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    units: "imperial",
    appid,
  });
  const geoParams = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    limit: "1",
    appid,
  });

  const [currentRes, forecastRes, airRes, geoRes] = await Promise.all([
    fetch(`${CURRENT}?${baseParams}`, { next: { revalidate: 1800 } }),
    fetch(`${FORECAST}?${baseParams}`, { next: { revalidate: 1800 } }),
    fetch(`${AIR}?${baseParams}`, { next: { revalidate: 3600 } }),
    fetch(`${REVERSE_GEO}?${geoParams}`, { next: { revalidate: 86400 } }),
  ]);

  if (!currentRes.ok) {
    throw new Error(`OpenWeather error: ${currentRes.status} ${await currentRes.text()}`);
  }
  if (!forecastRes.ok) {
    throw new Error(
      `OpenWeather forecast error: ${forecastRes.status} ${await forecastRes.text()}`,
    );
  }

  const current = (await currentRes.json()) as OWMCurrent;
  const forecast = (await forecastRes.json()) as OWMForecast;
  const air = airRes.ok ? ((await airRes.json()) as OWMAir) : null;
  const geo = geoRes.ok ? ((await geoRes.json()) as OWMReverseGeo) : null;

  const place = geo?.[0];
  const tz = current.timezone;

  // Hourly: next 4 entries from the 3-hour-bucketed 5-day forecast (~12h)
  const hourly: HourlyPoint[] = forecast.list.slice(0, 4).map((entry) => ({
    time: entry.dt,
    temp: entry.main.temp,
    condition: normalizeCondition(entry.weather[0]?.id ?? 800),
  }));

  return {
    city: place?.name ?? current.name ?? "Somewhere",
    country: place?.country ?? current.sys.country,
    current: {
      temp: current.main.temp,
      feelsLike: current.main.feels_like,
      condition: normalizeCondition(current.weather[0]?.id ?? 800),
      conditionRaw: current.weather[0]?.description ?? "",
      humidity: current.main.humidity,
      windSpeed: current.wind.speed,
      uvi: 0,
      sunrise: current.sys.sunrise,
      sunset: current.sys.sunset,
      timezoneOffset: tz,
    },
    hourly,
    daily: aggregateDaily(forecast.list, tz),
    aqi: air?.list?.[0]?.main.aqi,
  };
}

// Aggregate 3-hour forecast entries into per-day buckets. For each bucket:
// - tempMin/Max = lowest/highest across the day's entries
// - condition  = the bucket entry whose local hour is closest to noon
//                (so a clear-noon-but-rainy-evening day reads as "clear")
function aggregateDaily(list: OWMForecastEntry[], tzOffsetSeconds: number): DailyPoint[] {
  type Bucket = {
    date: string;
    entries: OWMForecastEntry[];
    min: number;
    max: number;
  };
  const order: string[] = [];
  const buckets = new Map<string, Bucket>();

  for (const entry of list) {
    const localDay = new Date((entry.dt + tzOffsetSeconds) * 1000)
      .toISOString()
      .slice(0, 10);
    let b = buckets.get(localDay);
    if (!b) {
      b = { date: localDay, entries: [], min: Infinity, max: -Infinity };
      buckets.set(localDay, b);
      order.push(localDay);
    }
    b.entries.push(entry);
    if (entry.main.temp_min < b.min) b.min = entry.main.temp_min;
    if (entry.main.temp_max > b.max) b.max = entry.main.temp_max;
  }

  return order.slice(0, 5).map((date) => {
    const b = buckets.get(date)!;
    const noonish = b.entries.reduce((best, current) => {
      const bestHr = new Date((best.dt + tzOffsetSeconds) * 1000).getUTCHours();
      const curHr = new Date((current.dt + tzOffsetSeconds) * 1000).getUTCHours();
      return Math.abs(curHr - 12) < Math.abs(bestHr - 12) ? current : best;
    });
    return {
      time: noonish.dt,
      tempMin: b.min,
      tempMax: b.max,
      condition: normalizeCondition(noonish.weather[0]?.id ?? 800),
    };
  });
}

export async function geocodeCity(
  name: string,
): Promise<{ lat: number; lon: number; city: string; country?: string } | null> {
  const params = new URLSearchParams({ q: name, limit: "1", appid: key() });
  const res = await fetch(`${FORWARD_GEO}?${params}`, { next: { revalidate: 86400 } });
  if (!res.ok) return null;
  const data = (await res.json()) as OWMForwardGeo;
  const hit = data[0];
  if (!hit) return null;
  return { lat: hit.lat, lon: hit.lon, city: hit.name, country: hit.country };
}

// Map OpenWeatherMap "weather[0].id" to our 6-state Condition.
// Reference: https://openweathermap.org/weather-conditions
export function normalizeCondition(id: number): Condition {
  if (id >= 200 && id < 300) return "thunderstorm";
  if (id >= 300 && id < 400) return "rain"; // drizzle
  if (id >= 500 && id < 600) return "rain";
  if (id >= 600 && id < 700) return "snow";
  if (id >= 700 && id < 800) return "overcast"; // mist, haze, fog, etc.
  if (id === 800) return "clear";
  if (id === 801 || id === 802) return "partly-cloudy";
  if (id === 803 || id === 804) return "overcast";
  return "clear";
}
