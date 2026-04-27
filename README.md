# Aurora

Aurora is an ambient weather dashboard.

It pulls live conditions for your location, picks a cinematic sky photo to match the current weather and time of day, and has an LLM write a 50-70 word literary paragraph about what's happening outside. Glass panels float over the photo. Live data, refreshed every 30 minutes.

**Live:** [aurora.angelrod.dev](https://aurora.angelrod.dev)

![Aurora](./public/scenes/og.png)

## What's in it

- A "now" card with the current temperature, condition, sunrise, and sunset.
- A "today's vibe" panel where an LLM writes a 50-70 word literary paragraph about the sky in present tense, in the spirit of Murakami.
- An hourly strip and a 5-day outlook fed by OpenWeatherMap's free 2.5 endpoints.
- A palette extractor that samples three dominant colors from the current scene and lets you click to copy any swatch.
- A share button that exports the composition as a PNG.
- 24 pre-generated sky backgrounds covering every (weather, time-of-day) combination, plus 8 micro-texture overlays composited via `mix-blend-mode: screen`.

## Engineering highlights

### The glass

Each panel uses layers. The base is `backdrop-filter: blur(24px) saturate(160%)` over an 8% white background. The 1px border is transparent, but it sits on a second background layer set to a 135° gradient (white at 30% fading to white at 5%), achieved with a dual-stack `background-clip`: solid color on padding-box, gradient on border-box. The result is a panel with a luminous edge that catches light from the corner.

An inset top-edge highlight at 6% white fades over the top 38% of the panel, simulating light bouncing off the lip of a real glass pane. The shadow is `0 24px 64px -16px rgba(0, 0, 0, 0.5)`. Children of the panel get `isolation: isolate` and a positive z-index, so text rides on its own sub-layer above the blur. That keeps the type crisp even when the scene behind is busy.

### The AI narrator

Three pieces run the vibe panel:

1. **Groq** with `llama-3.3-70b-versatile` as the primary model. Fast and free at this volume.
2. **OpenRouter** with `deepseek/deepseek-r1:free` as the fallback. When Groq returns 429, the route catches it and re-runs the same prompt against DeepSeek without the user noticing.
3. **Upstash Redis** holding a 30-minute cache keyed on (city, condition, hour-bucket). Same place plus same conditions plus same hour returns the cached paragraph for zero tokens.

The route runs a sliding-window rate limit through the same Upstash database: 3 calls per minute and 20 per day per IP.

The system prompt is short:

> Literary weather narrator. 50-70 words, present tense, sensory and atmospheric, in the spirit of Murakami. No clichés. Don't name the city, let it be a place. Output the paragraph only.

The user prompt is the city, condition, temperature, and local hour. The model handles the prose.

### The sky matrix

Aurora needs 24 backgrounds (6 weather conditions by 4 time-of-day bands). Hermes Agent ran the prompt matrix through ChatGPT Images 2.0 to generate them. The master prompt template plus 24 hand-tuned scene phrases live in [public/scenes/PROMPTS.md](./public/scenes/PROMPTS.md).

At runtime, [lib/scene-picker.ts](./lib/scene-picker.ts) reads the current weather condition plus your local hour relative to sunrise and sunset, and returns a SceneKey like `partly-cloudy-dusk`. `SceneBackground` loads `/scenes/partly-cloudy-dusk.webp`. On top of the scene, a matching texture overlay (rain streaks, snow flurries, lightning glow, drifting wisps) composites in via `mix-blend-mode: screen` with a 60-second drift loop.

### Motion

GSAP runs the entrance and the parallax. Each panel enters on a 400ms tween (opacity 0 to 1, translateY 12px to 0) staggered 80ms apart in `power3.out`. A separate handler tracks the mouse via `gsap.quickTo` and writes per-panel parallax up to 6px scaled by depth. React state never sees a mouse event. `prefers-reduced-motion` disables both the entrance and the parallax.

## Stack

- **Next.js 15** (App Router, React Server Components) on **Node 22** with **React 19**
- **Tailwind CSS 4** (CSS-first config in `app/globals.css`)
- **GSAP** for entrance choreography and mouse parallax
- **OpenWeatherMap 2.5** free endpoints for live weather
- **Groq** plus **OpenRouter** for the LLM narrator and its fallback
- **Upstash Redis** for the 30-minute narration cache and the rate limiter
- **html-to-image** for the share-as-PNG export
- **Vercel Hobby** for hosting

Every dependency runs on its free tier. No credit card required.

## Setup

```bash
nvm use 22
npm install
cp .env.local.example .env.local
# fill in the keys (see "Keys" below), then:
npm run dev
```

Visit http://localhost:3000.

## Keys

All free, no credit card needed.

| Variable                   | Service        | Sign up                                  |
| -------------------------- | -------------- | ---------------------------------------- |
| `OPENWEATHER_API_KEY`      | OpenWeatherMap | https://home.openweathermap.org/api_keys |
| `GROQ_API_KEY`             | Groq           | https://console.groq.com/keys            |
| `OPENROUTER_API_KEY`       | OpenRouter     | https://openrouter.ai/keys               |
| `UPSTASH_REDIS_REST_URL`   | Upstash        | https://console.upstash.com              |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash        | (same console as above)                  |

OpenWeatherMap's free 2.5 tier covers current weather plus a 5-day forecast at 3-hour intervals. For true 1-hour granularity and a 7-day endpoint, swap to One Call 3.0 by reverting `lib/weather.ts` to its first commit. One Call 3.0 stays free under 1,000 calls per day but needs a credit card on file.

## Project structure

```
aurora-mood-dashboard/
  app/
    page.tsx                # the scene
    outlook/page.tsx        # 5-day outlook
    api/vibe/route.ts       # POST { city, condition, temp, hour } -> narration
    api/weather/route.ts    # GET ?lat&lon -> weather snapshot
  components/
    scene/SceneBackground.tsx
    scene/GlassPanel.tsx    # entrance + parallax
    scene/NowCard.tsx
    scene/HourlyStrip.tsx
    scene/VibePanel.tsx
    scene/PaletteStrip.tsx
    share/ShareButton.tsx
  lib/
    weather.ts              # OWM client and condition normalizer
    scene-picker.ts         # condition + sun-relative hour -> SceneKey
    groq.ts                 # primary narrator
    openrouter.ts           # narrator fallback
    ratelimit.ts            # Upstash sliding window
    cache.ts                # 30-min narration cache
  styles/glass.css          # the glass primitive
  public/scenes/            # 24 backgrounds + og.png
  public/textures/          # 8 overlays
```

## Images

The 24 sky backgrounds and 8 texture overlays are in the repo. The PROMPTS.md files in their folders document the prompts:

- [public/scenes/PROMPTS.md](./public/scenes/PROMPTS.md) for the 24 scenes plus the OG image
- [public/textures/PROMPTS.md](./public/textures/PROMPTS.md) for the 8 overlays plus the condition mapping

Hermes Agent generated all 33 images on ChatGPT Images 2.0.

## Scripts

```bash
npm run dev        # next dev
npm run build      # next build
npm run start      # next start
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

## Performance

The home route ships at 32.9 kB First Load JS. The outlook route is 161 B plus 106 kB shared. Every weather and geocode fetch revalidates at 1800 seconds, so most visitors never touch OpenWeatherMap. The vibe cache uses a separate 30-minute window keyed on (city, condition, hour-bucket).

## Deployment

Deployed to Vercel Hobby. Set `OPENWEATHER_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` on the project's environment variables before pushing to production.

## License

MIT.
