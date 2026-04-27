# Scene background prompts

24 backgrounds = 6 conditions × 4 time bands. Drop the generated WebPs in this
folder using the file naming `{condition}-{timeBand}.webp` (lowercase, hyphenated).

**Output spec:** 2880×1800 (16:10), WebP, no alpha. Re-encoded to AVIF/WebP by
`next/image` at request time, so generate at the highest quality your tool gives.

**Master template (do not change):**

> Cinematic ambient photograph of `[scene-specific phrase]`, no people, no
> buildings, no text, dramatic color grading in the style of a Terrence Malick
> film, soft focus foreground, 16:10 aspect ratio, 2880×1800, no logos, no
> watermarks.

Drop one of the phrases below into `[scene-specific phrase]` for each file.

## Filename → scene-specific phrase

### Clear (cloudless)
- `clear-dawn.webp` — a clear sky at first light, low coral-and-gold horizon bleeding into pre-dawn cobalt, two pale contrails arcing east, single planet still visible, dew-lit grass in the soft-focus foreground
- `clear-day.webp` — a clear summer sky at high noon, deep cerulean overhead grading to a hot pale blue at the horizon, sun out of frame, heat haze rising over a dry meadow in the soft-focus foreground
- `clear-dusk.webp` — a clear sky at the moment after sunset, sherbet bands of magenta, peach and bruised lavender holding above a flat horizon, first star, silhouette of tall grass in the soft-focus foreground
- `clear-night.webp` — a clear night sky, deep navy washing into ink at zenith, faint Milky Way band, no light pollution, frost-tipped reeds in the soft-focus foreground

### Partly cloudy (broken cumulus)
- `partly-cloudy-dawn.webp` — broken cumulus at sunrise, undersides catching molten orange while the tops stay cool grey-blue, generous open sky between clouds, dewy field in the soft-focus foreground
- `partly-cloudy-day.webp` — fair-weather cumulus drifting across a vibrant midday blue, crisp edges, hard shadows on a wheatfield ribbon in the soft-focus foreground
- `partly-cloudy-dusk.webp` — scattered clouds at golden hour, rim-lit copper edges, deep teal sky between gaps, long shadows across a rolling-hill foreground
- `partly-cloudy-night.webp` — patchy clouds drifting across a moonlit night sky, full moon back-lighting the cloud edges into silver, dark grass plain in the soft-focus foreground

### Overcast (full cloud cover)
- `overcast-dawn.webp` — a low overcast morning, monochrome dove-grey ceiling with a single warmer stripe at the horizon, damp asphalt sheen in the soft-focus foreground
- `overcast-day.webp` — a featureless slate-grey overcast at midday, diffuse light, no visible sun, wind-flattened reeds in the soft-focus foreground
- `overcast-dusk.webp` — overcast at last light, the cloud deck taking a faint salmon underglow, the rest of the sky drained to charcoal, wet stone wall in the soft-focus foreground
- `overcast-night.webp` — heavy overcast at night, sky a uniform deep graphite, ambient sodium glow reflecting faintly off the cloud base, dark wet field in the soft-focus foreground

### Rain
- `rain-dawn.webp` — a steady rainstorm at first light, low slate clouds with a brassy crack of dawn at the horizon, sheet of falling rain visible against the brighter strip, puddled gravel in the soft-focus foreground
- `rain-day.webp` — a midday downpour, dense grey cloud, visible diagonal rain curtains, wet leaves and dripping branches in the soft-focus foreground
- `rain-dusk.webp` — rain at sunset, waterlogged clouds glowing faintly amber underneath, rest of the sky bruised plum, rain-streaked window framing in the soft-focus foreground
- `rain-night.webp` — heavy rain on a black night, only ambient streetlight catching the falling streaks, glistening puddle reflections in the soft-focus foreground

### Snow
- `snow-dawn.webp` — a calm snowfall at dawn, sky a soft pale rose, fat flakes hanging in the air, untouched snowfield with a dark fence-line in the soft-focus foreground
- `snow-day.webp` — daytime snowfall, flat white-grey sky merging with the snow, low contrast, frosted pine bough in the soft-focus foreground
- `snow-dusk.webp` — heavy snow at twilight, sky a deep indigo, flakes lit by ambient blue, footprints filling in across the soft-focus foreground
- `snow-night.webp` — a quiet snowy night, sky black-violet, large snowflakes catching a single warm light source out of frame, deep snow drift in the soft-focus foreground

### Thunderstorm
- `thunderstorm-dawn.webp` — a thunderstorm at dawn, towering charcoal cumulonimbus with a coral sliver of sky breaking through at the horizon, lightning flash silhouetting cloud structure, wet plain in the soft-focus foreground
- `thunderstorm-day.webp` — a daytime supercell, anvil top spreading, mid-cloud lit a sickly green-bronze, distant lightning bolt earthing into a flat field in the soft-focus foreground
- `thunderstorm-dusk.webp` — a thunderstorm at last light, the storm wall lit fuchsia and copper from underneath while the rest of the sky goes deep blue, faint lightning glow inside the cloud, lake-mirror foreground
- `thunderstorm-night.webp` — a thunderstorm at night, near-black sky punched through by a forked white-violet lightning bolt freezing the scene, soaked pavement reflecting the flash in the soft-focus foreground

## Where each shows up

`SceneBackground.tsx` resolves a key like `clear-dusk` from `lib/scene-picker.ts`
based on current condition + sun-relative hour. The matching file is loaded
via `next/image` with `fill priority` and sits at the bottom of the visual
stack, behind every glass panel.

A 30% black scrim and a `/textures/` overlay (see ../textures/PROMPTS.md) are
composited on top of the scene before any glass renders.

## OG sharing card

One additional asset for `/public/og.png`, 1200×1200:

> Cinematic ambient composition: a single floating glass panel reading
> "Aurora" in pale type, drifting over a Malick-style dusk sky of partly
> cloudy magenta and copper, no people, no buildings, no other text, dramatic
> color grading, soft focus, 1:1 aspect, no logos, no watermarks.
