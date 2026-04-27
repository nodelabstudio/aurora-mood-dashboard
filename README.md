# Aurora

Ambient weather-and-mood dashboard. Layered frosted-glass panels over a
Malick-grade sky, with a small AI "today's vibe" narrator.

## Status

Scaffolded only. File tree, configs, dependencies, env stubs, and component
shells are in place. No components are implemented yet. Image assets in
`public/scenes/` and `public/textures/` are not generated — see the
`PROMPTS.md` files in those folders.

## Stack

- **Next.js 15** (App Router, RSC) on **Node 22** / **React 19**
- **Tailwind CSS 4** (CSS-first config in `app/globals.css`)
- **GSAP** for panel entrance choreography and mouse-tracked parallax
  (`gsap.quickTo` for the per-frame setters). Framer Motion intentionally not
  installed — keeps the animation system in a single library.
- **OpenWeatherMap 2.5 free endpoints** (`/data/2.5/weather` + `/data/2.5/forecast` + `/data/2.5/air_pollution`) for weather data — no credit card, no subscription. Hourly is 3-hour-bucketed (4 cells across ~12h); the 5-day outlook is aggregated from the 5-day forecast.
- **Groq** (`llama-3.3-70b-versatile`) primary, **OpenRouter**
  (`deepseek/deepseek-r1:free`) fallback for the narrator
- **Upstash Redis** for sliding-window rate limit + narration cache
- **html-to-image** for the share-as-PNG export
- **Vercel** deploy target

## Setup

```bash
nvm use 22                  # Node 22+ required (Tailwind 4 + Next 15)
npm install
cp .env.local.example .env.local
# fill in the keys (see "API keys" below), then:
npm run dev
```

Visit http://localhost:3000.

## API keys

All free with no credit card except OpenWeatherMap. Each link below opens the
console for that service.

| Variable                  | Service        | Free?                       | Sign up                                     |
| ------------------------- | -------------- | --------------------------- | ------------------------------------------- |
| `OPENWEATHER_API_KEY`     | OpenWeatherMap | free 2.5, no CC             | https://home.openweathermap.org/api_keys    |
| `GROQ_API_KEY`            | Groq           | rate-limited, no CC         | https://console.groq.com/keys               |
| `OPENROUTER_API_KEY`      | OpenRouter     | daily quota, no CC          | https://openrouter.ai/keys                  |
| `UPSTASH_REDIS_REST_URL`  | Upstash        | 10K commands/day, no CC     | https://console.upstash.com                 |
| `UPSTASH_REDIS_REST_TOKEN`| Upstash        | (same DB)                   | (same console)                              |

OWM 2.5 is fully free with just a basic key — no card required. If you want
to swap back to One Call 3.0 for true hourly granularity (12 cells of 1-hour
forecast and a real 7-day endpoint), see git history for `lib/weather.ts`
and resubscribe at https://openweathermap.org/api/one-call-3 (CC required).

## File tree

```
aurora/
  app/
    page.tsx                # the scene
    outlook/page.tsx        # 7-day view
    api/vibe/route.ts       # POST { city, condition, temp, hour } → narration
    api/weather/route.ts    # GET ?lat&lon → weather snapshot
  components/
    scene/SceneBackground.tsx
    scene/GlassPanel.tsx    # the glass primitive (entrance + parallax)
    scene/NowCard.tsx
    scene/HourlyStrip.tsx
    scene/VibePanel.tsx
    scene/PaletteStrip.tsx
    share/ShareButton.tsx
  lib/
    weather.ts              # OWM client + condition normalizer
    scene-picker.ts         # condition + sun-relative hour → SceneKey
    groq.ts                 # primary narrator
    openrouter.ts           # narrator fallback
    ratelimit.ts            # Upstash sliding window
    cache.ts                # 30-min narration cache
  styles/glass.css          # the glass primitive (visual layer)
  public/scenes/            # 24 backgrounds, see PROMPTS.md
  public/textures/          # 8 overlays, see PROMPTS.md
```

## Image assets

You generate these separately and drop them in. Prompts and filename mapping:

- **24 scene backgrounds:** [`public/scenes/PROMPTS.md`](./public/scenes/PROMPTS.md)
- **8 texture overlays:**   [`public/textures/PROMPTS.md`](./public/textures/PROMPTS.md)
- **1 OG share card:**      `public/og.png` (prompt at the bottom of the scenes file)

## Scripts

```bash
npm run dev        # next dev (turbopack)
npm run build      # next build
npm run start      # next start
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

## Deployment

Vercel, Hobby plan. Custom domain `aurora.angelrod.dev` is **not yet
configured** — the site will live on the auto-generated Vercel URL until the
domain is wired up.
