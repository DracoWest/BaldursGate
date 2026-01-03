import React, { useEffect, useRef, useState } from "react";

type GateState = "idle" | "typing" | "success" | "fail";

type Props = {
  idleSrc?: string;
  successSrc?: string;
  failSrc?: string;
  /** Optional sounds. Only plays if user interaction allows it. */
  goodSoundSrc?: string;
  badSoundSrc?: string;
  enableSound?: boolean;
};

export default function GatekeeperCat({
  idleSrc = "/gate/idle.png",
  successSrc = "/gate/granted.png",
  failSrc = "/gate/denied.png",
  goodSoundSrc = "/gate/grant.mp3",
  badSoundSrc = "/gate/deny.mp3",
  enableSound = false,
}: Props) {
  const [state, setState] = useState<GateState>("idle");
  const [text, setText] = useState("Awaiting an incantation…");

  const resetTimer = useRef<number | null>(null);
  const goodAudioRef = useRef<HTMLAudioElement | null>(null);
  const badAudioRef = useRef<HTMLAudioElement | null>(null);

  const currentSrc =
    state === "success" ? successSrc : state === "fail" ? failSrc : idleSrc;

  function clearReset() {
    if (resetTimer.current) window.clearTimeout(resetTimer.current);
    resetTimer.current = null;
  }

  function playSound(which: "good" | "bad") {
    if (!enableSound) return;
    try {
      const el = which === "good" ? goodAudioRef.current : badAudioRef.current;
      if (!el) return;
      el.currentTime = 0;
      void el.play();
    } catch {
      // ignore autoplay blocks
    }
  }

  function setGateState(next: GateState) {
    clearReset();

    if (next === "idle") {
      setState("idle");
      setText("Awaiting an incantation…");
      return;
    }

    if (next === "typing") {
      setState("typing");
      setText("The gatekeeper watches…");
      return;
    }

    if (next === "success") {
      setState("success");
      setText("Access granted.");
      playSound("good");
      resetTimer.current = window.setTimeout(() => setGateState("idle"), 1200);
      return;
    }

    if (next === "fail") {
      setState("fail");
      setText("Access denied.");
      playSound("bad");
      resetTimer.current = window.setTimeout(() => setGateState("idle"), 1200);
      return;
    }
  }

  useEffect(() => {
    const handler = (ev: Event) => {
      const e = ev as CustomEvent<{ state?: GateState }>;
      const next = e?.detail?.state;
      if (!next) return;
      setGateState(next);
    };

    window.addEventListener("dracowest:gatekeeper", handler);
    return () => {
      clearReset();
      window.removeEventListener("dracowest:gatekeeper", handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full flex flex-col items-center gap-3 mt-6">
      {/* Local styles for blink/glow/shake */}
      <style>{`
        .gateCat {
          width: 170px;
          height: 170px;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid rgba(176,141,87,0.35);
          background: rgba(0,0,0,0.25);
          box-shadow: 0 18px 60px rgba(0,0,0,0.55);
          position: relative;
        }
        .gateCat img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
          transform-origin: 50% 60%;
        }

        @keyframes gateBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          94%, 96% { transform: scaleY(0.08); }
        }
        .gateIdle img { animation: gateBlink 5.5s infinite; }

        @keyframes gateSuccessGlow {
          0% { box-shadow: 0 18px 60px rgba(0,0,0,0.55); }
          50% { box-shadow: 0 0 0 6px rgba(176,141,87,0.22), 0 0 26px rgba(176,141,87,0.35), 0 18px 60px rgba(0,0,0,0.55); }
          100% { box-shadow: 0 18px 60px rgba(0,0,0,0.55); }
        }
        .gateSuccess {
          border-color: rgba(226,192,141,0.65);
          animation: gateSuccessGlow 0.9s ease-out 1;
        }

        @keyframes gateShake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
          100% { transform: translateX(0); }
        }
        .gateFail {
          border-color: rgba(255,107,107,0.8);
          box-shadow: 0 0 0 6px rgba(255,107,107,0.14), 0 0 26px rgba(255,107,107,0.22), 0 18px 60px rgba(0,0,0,0.55);
          animation: gateShake 0.45s ease-in-out 1;
        }

        @media (max-width: 480px){
          .gateCat { width: 140px; height: 140px; }
        }
      `}</style>

      <div
        className={[
          "gateCat",
          state === "idle" || state === "typing" ? "gateIdle" : "",
          state === "success" ? "gateSuccess" : "",
          state === "fail" ? "gateFail" : "",
        ].join(" ")}
        aria-live="polite"
      >
        <img src={currentSrc} alt="Gatekeeper cat" />
      </div>

      <div className="text-center">
        <div className="font-cinzel tracking-widest text-[var(--accent-gold)] text-sm">
          Gatekeeper
        </div>
        <div className="font-medieval uppercase tracking-[0.25em] text-[10px] text-stone-500">
          {text}
        </div>
      </div>

      {/* Optional audio */}
      {enableSound && (
        <>
          <audio ref={goodAudioRef} src={goodSoundSrc} preload="auto" />
          <audio ref={badAudioRef} src={badSoundSrc} preload="auto" />
        </>
      )}
    </div>
  );
}
