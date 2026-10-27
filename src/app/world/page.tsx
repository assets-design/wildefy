import type { Metadata } from "next";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { HomeGlobeSection } from "@/components/homeGlobe/GlobeSection";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StageFrame } from "@/components/layout/StageFrame";
import styles from "./world.module.css";

export const metadata: Metadata = {
  title: "World — Wildefy",
  description:
    "Scroll the Wildefy world — from the globe into India, Galápagos, Maasai Mara, and Svalbard.",
};

export default function WorldPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <StageFrame>
          <div className={styles.headerInner}>
            <SiteHeader />
          </div>
        </StageFrame>
      </div>
      <HomeGlobeSection />
      <div className={styles.footer}>
        <FooterReveal />
      </div>
    </div>
  );
}
