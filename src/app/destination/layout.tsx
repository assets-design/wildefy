import type { ReactNode } from "react";

export default function DestinationLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#ffffff",
        minHeight: "100vh",
        color: "#000000",
      }}
    >
      {children}
    </div>
  );
}
