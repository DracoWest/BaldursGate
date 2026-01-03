import React, { useEffect, useState } from "react";

type GatekeeperState = "idle" | "success" | "fail";

interface GatekeeperCatProps {
  idleSrc: string;
  successSrc: string;
  failSrc: string;
  enableSound?: boolean;
}

const GatekeeperCat: React.FC<GatekeeperCatProps> = ({
  idleSrc,
  successSrc,
  failSrc,
  enableSound = false,
}) => {
  const [state, setState] = useState<GatekeeperState>("idle");

  const src =
    state === "success"
      ? successSrc
      : state === "fail"
      ? failSrc
      : idleSrc;

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail?.state) return;

      setState(detail.state);

      if (detail.state !== "idle") {
        setTimeout(() => setState("idle"), 1200);
      }
    };

    window.addEventListener("dracowest:gatekeeper", handler);
    return () =>
      window.removeEventListener("dracowest:gatekeeper", handler);
  }, []);

  return (
    <div className="flex flex-col items-center mt-6">
      <div
        className={`relative w-40 h-40 rounded-full overflow-hidden border
          ${
            state === "success"
              ? "border-yellow-400 shadow-[0_0_25px_rgba(176,141,87,0.6)]"
              : state === "fail"
              ? "border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.6)]"
              : "border-yellow-600/40"
          }
        `}
      >
        {/* KEY IS THE FIX */}
        <img
          key={state} 
          src={src}
          alt="Gatekeeper"
          className={`w-full h-full object-cover
            ${state === "fail" ? "animate-shake" : ""}
          `}
          draggable={false}
        />
      </div>

      <div className="mt-3 text-[10px] tracking-widest uppercase text-stone-400 font-medieval">
        Gatekeeper
      </div>
      <div className="text-[10px] tracking-[0.2em] uppercase text-stone-500">
        {state === "idle"
          ? "Awaiting an incantation…"
          : state === "success"
          ? "Access granted."
          : "Access denied."}
      </div>
    </div>
  );
};

export default GatekeeperCat;
