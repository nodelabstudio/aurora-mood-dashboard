# Texture overlay prompts

8 micro-textures composited above `SceneBackground` with
`mix-blend-mode: screen` (or `lighten`) so the bright pixels show through and
the rest disappears. Each is loaded only when its weather condition is active.

**Output spec:** 2880×1800 PNG, **transparent background**, mostly dark with a
few bright streaks/specks/wisps. The black/dark areas vanish under `screen`
blend mode; only the highlights remain. If a tool refuses to give true alpha,
ask for a pure black background — `mix-blend-mode: screen` will treat that as
transparent automatically.

## Filename → texture phrase

- `rain-light.png` — Macro photograph: faint diagonal rain streaks against pure black background, thin verticals tilted ~15°, motion-blurred, sparse, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `rain-heavy.png` — Macro photograph: dense diagonal rain streaks against pure black background, thicker streaks, longer motion blur, heavier coverage but still 60%+ negative space, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `snow-flurry.png` — Macro photograph: sparse snowflakes drifting against pure black background, varied sizes, gentle motion blur on a few, soft-focus depth-of-field flakes in front and back planes, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `snow-blizzard.png` — Macro photograph: heavy snow against pure black background, dense flakes with horizontal motion-streaks, layered depth, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `sun-flare.png` — Photographic anamorphic lens flare against pure black background, single warm light source out of frame upper-right, horizontal streak with a few ghost orbs along its axis, very subtle, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `cloud-wisps.png` — Macro photograph: thin stratus cloud wisps drifting horizontally against pure black background, semi-transparent, soft-focus, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `mist-veil.png` — Macro photograph: low-contrast mist gauze drifting low across the frame against pure black background, very faint, more atmosphere than substance, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos
- `lightning-glow.png` — Photograph: a single forked lightning bolt frozen against pure black background, white-violet core with cyan halo, branching once, the rest of the frame solid black, no people, no objects, no text, 16:10 aspect 2880×1800, transparent or pure black background, no logos

## How they map to conditions (component phase)

| Condition       | Default overlay      | Notes                                  |
| --------------- | -------------------- | -------------------------------------- |
| `clear`         | `sun-flare.png`      | Daylight bands only; skip at night.    |
| `partly-cloudy` | `cloud-wisps.png`    | Always-on, low opacity (~25%).         |
| `overcast`      | `mist-veil.png`      | Subtle, ~20% opacity.                  |
| `rain`          | `rain-light.png` or `rain-heavy.png` | Heavy if API returns >5mm/hr. |
| `snow`          | `snow-flurry.png` or `snow-blizzard.png` | Heavy if visibility <1km.   |
| `thunderstorm`  | `lightning-glow.png` + `rain-heavy.png` | Pulsed, not constant.        |

## CSS hint

```css
.texture-overlay {
  position: absolute;
  inset: 0;
  mix-blend-mode: screen;
  pointer-events: none;
  /* gentle drift so the texture doesn't feel pinned */
  animation: drift 60s linear infinite;
}
```
