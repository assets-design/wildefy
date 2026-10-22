"use client";

import {
  createContext,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { FallingParticles } from "@/components/hero/FallingParticles";

type JourneyContextValue = {
  bgRef: RefObject<HTMLImageElement | null>;
  cloudRef: RefObject<HTMLImageElement | null>;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) {
    throw new Error("useJourney must be used within JourneyShell");
  }
  return value;
}

export function JourneyShell({ children }: { children: ReactNode }) {
  const bgRef = useRef<HTMLImageElement>(null);
  const cloudRef = useRef<HTMLImageElement>(null);

  return (
    <JourneyContext.Provider value={{ bgRef, cloudRef }}>
      <div className="journey-shell">
        <div className="journey-backdrop" aria-hidden="true">
          <img
            ref={bgRef}
            className="journey-backdrop-photo"
            src="/images/hero/hero%20bg.png"
            alt=""
            width={7680}
            height={4000}
            draggable={false}
          />
          {/* Single full cloud background — no wash/mist overlays. */}
          <img
            ref={cloudRef}
            className="journey-cloud"
            src="/images/clouds-section.png"
            alt=""
            width={1600}
            height={2800}
            draggable={false}
          />
          <FallingParticles />
        </div>
        <div className="journey-foreground">{children}</div>
      </div>
    </JourneyContext.Provider>
  );
}
