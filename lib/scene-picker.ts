import type { Condition } from "./weather";

export type TimeBand = "dawn" | "day" | "dusk" | "night";

// 24 backgrounds = 6 conditions x 4 time bands
export type SceneKey = `${Condition}-${TimeBand}`;

// Classify the current moment relative to sunrise/sunset.
//   dawn: sunrise - 30min ... sunrise + 60min
//   day:  sunrise + 60min ... sunset - 60min
//   dusk: sunset - 60min  ... sunset + 30min
//   night: everything else
export function pickTimeBand(
  nowUnix: number,
  sunriseUnix: number,
  sunsetUnix: number,
): TimeBand {
  const m = 60;
  if (nowUnix >= sunriseUnix - 30 * m && nowUnix < sunriseUnix + 60 * m) return "dawn";
  if (nowUnix >= sunriseUnix + 60 * m && nowUnix < sunsetUnix - 60 * m) return "day";
  if (nowUnix >= sunsetUnix - 60 * m && nowUnix < sunsetUnix + 30 * m) return "dusk";
  return "night";
}

export function pickScene(condition: Condition, band: TimeBand): SceneKey {
  return `${condition}-${band}`;
}
