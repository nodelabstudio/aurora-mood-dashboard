import type { Condition } from "@/lib/weather";
import type { TimeBand } from "@/lib/scene-picker";

type Props = {
  condition: Condition;
  timeBand: TimeBand;
};

// Texture overlay choice per condition. Day/night agnostic — texture provides
// the *motion* signal (rain streaks, drifting flakes), the scene image
// provides the time-of-day color.
const TEXTURE_FOR_CONDITION: Partial<Record<Condition, string>> = {
  rain: "rain-light",
  snow: "snow-flurry",
  thunderstorm: "lightning-glow",
  "partly-cloudy": "cloud-wisps",
  overcast: "mist-veil",
};

export default function SceneBackground({ condition, timeBand }: Props) {
  const sceneSrc = `/scenes/${condition}-${timeBand}.webp`;
  const texture = TEXTURE_FOR_CONDITION[condition];
  const fallback = sceneFallbackGradient(condition, timeBand);

  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      style={{ background: fallback }}
      aria-hidden
    >
      {/* Scene image — uses CSS background-image so a missing file is silent
          and the fallback gradient stays visible (next/image throws on 404). */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${sceneSrc})` }}
      />

      {/* Optional texture overlay drifted with screen blend */}
      {texture && (
        <div
          className="absolute inset-0 pointer-events-none scene-texture"
          style={{
            backgroundImage: `url(/textures/${texture}.png)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            mixBlendMode: "screen",
            opacity: 0.55,
          }}
        />
      )}

      {/* Bottom scrim for legibility under the hourly strip */}
      <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/55 via-black/20 to-transparent pointer-events-none" />

      {/* Top scrim for legibility under the header */}
      <div className="absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />

      {/* Stationary grain — pointer-events-none, GPU-cheap */}
      <div className="absolute inset-0 pointer-events-none scene-grain" />
    </div>
  );
}

// Fallback gradients per scene. Visible before AI scenes are generated, and
// underneath any image that 404s. Tuned to read like the corresponding sky
// rather than as a placeholder.
function sceneFallbackGradient(condition: Condition, band: TimeBand): string {
  const palette: Record<TimeBand, Record<Condition, string>> = {
    dawn: {
      clear:
        "linear-gradient(180deg,#f0a584 0%,#d8866f 18%,#5e7caa 60%,#1a2d4a 100%)",
      "partly-cloudy":
        "linear-gradient(180deg,#d8866f 0%,#a06a7e 30%,#6c7e9d 65%,#1d2638 100%)",
      overcast:
        "linear-gradient(180deg,#a89ea4 0%,#7c7682 50%,#3a3540 100%)",
      rain:
        "linear-gradient(180deg,#7c8390 0%,#525866 50%,#22262e 100%)",
      snow:
        "linear-gradient(180deg,#d6d4dc 0%,#9a98a4 55%,#4d4f5a 100%)",
      thunderstorm:
        "linear-gradient(180deg,#766c79 0%,#3f3a44 55%,#1a1820 100%)",
    },
    day: {
      clear:
        "linear-gradient(180deg,#79b3e6 0%,#9bc3e6 50%,#c8dceb 100%)",
      "partly-cloudy":
        "linear-gradient(180deg,#6ba3d4 0%,#9cbcd2 50%,#c8d4dc 100%)",
      overcast:
        "linear-gradient(180deg,#a8b0bb 0%,#7e858f 100%)",
      rain:
        "linear-gradient(180deg,#5d6772 0%,#3d434c 100%)",
      snow:
        "linear-gradient(180deg,#cfd3d9 0%,#8e95a0 100%)",
      thunderstorm:
        "linear-gradient(180deg,#4b4f5a 0%,#262830 100%)",
    },
    dusk: {
      clear:
        "linear-gradient(180deg,#ee9a6e 0%,#c2748a 35%,#693d70 70%,#2d2351 100%)",
      "partly-cloudy":
        "linear-gradient(180deg,#d28778 0%,#a05f7a 35%,#5a3a64 70%,#211a3e 100%)",
      overcast:
        "linear-gradient(180deg,#7c7382 0%,#48414e 100%)",
      rain:
        "linear-gradient(180deg,#5e6271 0%,#2a2c38 100%)",
      snow:
        "linear-gradient(180deg,#a39fae 0%,#52546a 100%)",
      thunderstorm:
        "linear-gradient(180deg,#4f4456 0%,#1c1722 100%)",
    },
    night: {
      clear:
        "linear-gradient(180deg,#0e132b 0%,#070a18 50%,#03050b 100%)",
      "partly-cloudy":
        "linear-gradient(180deg,#15192d 0%,#080b16 100%)",
      overcast:
        "linear-gradient(180deg,#1c2028 0%,#0c0e14 100%)",
      rain:
        "linear-gradient(180deg,#1a1d24 0%,#070910 100%)",
      snow:
        "linear-gradient(180deg,#2c2e3b 0%,#10121a 100%)",
      thunderstorm:
        "linear-gradient(180deg,#181620 0%,#070509 100%)",
    },
  };
  return palette[band][condition];
}
