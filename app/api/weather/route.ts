import { NextRequest, NextResponse } from "next/server";
import { fetchWeather, geocodeCity } from "@/lib/weather";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const city = sp.get("city");

  let lat = parseFloat(sp.get("lat") ?? "");
  let lon = parseFloat(sp.get("lon") ?? "");

  try {
    if (city && (Number.isNaN(lat) || Number.isNaN(lon))) {
      const geo = await geocodeCity(city);
      if (!geo) {
        return NextResponse.json({ error: "city_not_found" }, { status: 404 });
      }
      lat = geo.lat;
      lon = geo.lon;
    }

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json({ error: "missing_coordinates" }, { status: 400 });
    }

    const snapshot = await fetchWeather(lat, lon);
    const res = NextResponse.json(snapshot);
    res.headers.set("Cache-Control", "public, max-age=1800, s-maxage=3600");
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: "weather_failed", message }, { status: 500 });
  }
}
