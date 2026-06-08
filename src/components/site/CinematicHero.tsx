import heroImg from "@/assets/hero-tyre.jpg";

/**
 * CinematicHero
 * Animated hero composition that simulates a cinematic moving-car shot:
 * - Subtle parallax bob on the car image (suggests forward motion)
 * - Horizontal neon light streaks flying past
 * - Motion blur streaks layered over wheels
 * - Soft drifting smoke
 * All animations loop seamlessly using pure CSS keyframes.
 */
export function CinematicHero() {
  return (
    <div className="cinematic-hero relative rounded-2xl overflow-hidden shadow-elegant border border-border bg-black">
      {/* Car image with gentle bob to imply movement */}
      <img
        src={heroImg}
        alt="Cinematic blue sports car in motion at Manoj Wheels futuristic service bay"
        width={1920}
        height={1080}
        className="ch-car w-full h-auto object-cover will-change-transform"
      />

      {/* Neon light streaks flying past the camera */}
      <div className="ch-streaks pointer-events-none absolute inset-0" aria-hidden>
        <span className="ch-streak ch-streak-1" />
        <span className="ch-streak ch-streak-2" />
        <span className="ch-streak ch-streak-3" />
        <span className="ch-streak ch-streak-4" />
        <span className="ch-streak ch-streak-5" />
        <span className="ch-streak ch-streak-6" />
      </div>

      {/* Spinning wheel overlays — positioned over the front & rear wheels of the hero image */}
      <div className="ch-wheels pointer-events-none absolute inset-0" aria-hidden>
        <div className="ch-wheel ch-wheel-front">
          <WheelSVG />
          <span className="ch-wheel-blur" />
        </div>
        <div className="ch-wheel ch-wheel-rear">
          <WheelSVG />
          <span className="ch-wheel-blur" />
        </div>
      </div>

      {/* Drifting smoke / ground haze */}
      <div className="ch-smoke pointer-events-none absolute inset-0" aria-hidden />

      {/* Vignette + speed blur edges */}
      <div className="ch-vignette pointer-events-none absolute inset-0" aria-hidden />

      <style>{`
        .cinematic-hero { perspective: 1200px; }

        .ch-car {
          animation: ch-bob 5s ease-in-out infinite;
          transform-origin: 50% 60%;
        }

        @keyframes ch-bob {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1.02); filter: saturate(1.05); }
          50%      { transform: translate3d(0, -6px, 0) scale(1.03); filter: saturate(1.15); }
        }

        .ch-streaks { mix-blend-mode: screen; }
        .ch-streak {
          position: absolute;
          left: -30%;
          height: 2px;
          width: 40%;
          border-radius: 999px;
          background: linear-gradient(90deg,
            transparent 0%,
            rgba(255,60,60,0) 5%,
            rgba(255,80,80,0.9) 50%,
            rgba(255,200,80,0.9) 80%,
            transparent 100%);
          filter: blur(1.2px);
          opacity: 0;
          animation: ch-streak 2.4s linear infinite;
        }
        .ch-streak-1 { top: 18%; height: 1.5px; width: 55%; animation-duration: 1.8s; animation-delay: 0s; }
        .ch-streak-2 { top: 32%; height: 3px;   width: 70%; animation-duration: 2.6s; animation-delay: .4s; }
        .ch-streak-3 { top: 47%; height: 2px;   width: 50%; animation-duration: 2.0s; animation-delay: .9s; }
        .ch-streak-4 { top: 62%; height: 2.5px; width: 65%; animation-duration: 2.3s; animation-delay: 1.2s; }
        .ch-streak-5 { top: 76%; height: 1.5px; width: 45%; animation-duration: 1.6s; animation-delay: .2s; }
        .ch-streak-6 { top: 88%; height: 3px;   width: 80%; animation-duration: 2.8s; animation-delay: 1.6s; }

        @keyframes ch-streak {
          0%   { transform: translate3d(0, 0, 0) scaleX(0.6); opacity: 0; }
          10%  { opacity: 1; }
          60%  { opacity: 1; }
          100% { transform: translate3d(260%, 0, 0) scaleX(1.4); opacity: 0; }
        }

        .ch-smoke {
          background:
            radial-gradient(60% 30% at 30% 95%, rgba(255,255,255,0.18), transparent 70%),
            radial-gradient(50% 25% at 75% 92%, rgba(255,255,255,0.12), transparent 70%);
          animation: ch-smoke 7s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        @keyframes ch-smoke {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: .85; }
          50%      { transform: translate3d(2%, -2%, 0); opacity: 1; }
        }

        .ch-vignette {
          background:
            radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%),
            linear-gradient(90deg, rgba(0,0,0,0.35), transparent 12%, transparent 88%, rgba(0,0,0,0.35));
        }

        /* Wheel overlays — tuned to match the hero car image */
        .ch-wheel {
          position: absolute;
          border-radius: 50%;
          transform-style: preserve-3d;
          mix-blend-mode: screen;
          opacity: 0.92;
        }
        /* Front wheel (camera-left, slightly larger because closer to camera) */
        .ch-wheel-front {
          width: 16%;
          aspect-ratio: 1 / 1;
          left: 30.5%;
          top: 56%;
          transform: perspective(800px) rotateY(-18deg) rotateX(6deg);
        }
        /* Rear wheel (further from camera, smaller, more skewed) */
        .ch-wheel-rear {
          width: 11.5%;
          aspect-ratio: 1 / 1;
          left: 64.5%;
          top: 58%;
          transform: perspective(800px) rotateY(-32deg) rotateX(8deg) scaleX(0.85);
        }
        .ch-wheel svg {
          width: 100%;
          height: 100%;
          display: block;
          animation: ch-spin 0.45s linear infinite;
          filter: blur(0.6px) drop-shadow(0 0 6px rgba(255,180,80,0.35));
        }
        .ch-wheel-blur {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background:
            conic-gradient(from 0deg,
              rgba(255,255,255,0.0) 0deg,
              rgba(255,255,255,0.22) 30deg,
              rgba(255,255,255,0.0) 90deg,
              rgba(255,255,255,0.22) 180deg,
              rgba(255,255,255,0.0) 240deg,
              rgba(255,255,255,0.22) 320deg,
              rgba(255,255,255,0.0) 360deg);
          filter: blur(6px);
          animation: ch-spin 0.25s linear infinite;
          mix-blend-mode: screen;
          opacity: 0.7;
        }
        @keyframes ch-spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .ch-car, .ch-streak, .ch-smoke,
          .ch-wheel svg, .ch-wheel-blur { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

function WheelSVG() {
  // Stylized 5-twin-spoke alloy with brake caliper hint
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <radialGradient id="rim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#cfd6df" />
          <stop offset="55%" stopColor="#8a96a4" />
          <stop offset="100%" stopColor="#2a2f36" />
        </radialGradient>
        <radialGradient id="hub" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#e8edf3" />
          <stop offset="100%" stopColor="#4a525c" />
        </radialGradient>
      </defs>
      {/* tyre */}
      <circle cx="50" cy="50" r="49" fill="#0a0a0a" />
      {/* rim outer */}
      <circle cx="50" cy="50" r="40" fill="url(#rim)" />
      {/* spokes — 5 pairs */}
      <g stroke="#dfe5ec" strokeWidth="3.2" strokeLinecap="round" opacity="0.95">
        {Array.from({ length: 5 }).map((_, i) => {
          const a = (i * 72 * Math.PI) / 180;
          const dx = Math.cos(a) * 36;
          const dy = Math.sin(a) * 36;
          const dx2 = Math.cos(a + 0.18) * 36;
          const dy2 = Math.sin(a + 0.18) * 36;
          return (
            <g key={i}>
              <line x1="50" y1="50" x2={50 + dx} y2={50 + dy} />
              <line x1="50" y1="50" x2={50 + dx2} y2={50 + dy2} />
            </g>
          );
        })}
      </g>
      {/* hub */}
      <circle cx="50" cy="50" r="11" fill="url(#hub)" stroke="#1a1d22" strokeWidth="1" />
      <circle cx="50" cy="50" r="3" fill="#1a1d22" />
    </svg>
  );
}
