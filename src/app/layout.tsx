import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Home — Wildefy",
  description:
    "Wildlife journeys, wilderness offsites and learning experiences shaped by the field.",
};

const stageScript = `(function () {
  var w = document.documentElement.clientWidth || 1920;
  var h = document.documentElement.clientHeight || 1000;
  var s = w <= 1023 ? 1 : Math.min(1, w / 1920);
  document.documentElement.style.setProperty("--stage-scale", String(s));
  document.documentElement.style.setProperty("--stage-visible", (h / s) + "px");
})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="stage-scale" strategy="beforeInteractive">
          {stageScript}
        </Script>
        {children}
      </body>
    </html>
  );
}
