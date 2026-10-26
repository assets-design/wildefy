import type { Metadata } from "next";
import { ScrollVideoExperience } from "@/components/cinematic/ScrollVideoExperience";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StageFrame } from "@/components/layout/StageFrame";
import styles from "./three-d.module.css";

export const metadata: Metadata = {
  title: "Mountain — Wildefy",
  description:
    "A silent, scroll-driven cinematic passage through the Wildefy mountain.",
};

export default function Wildefy3DRoute() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <StageFrame>
          <div className={styles.headerInner}>
            <SiteHeader />
          </div>
        </StageFrame>
      </div>
      <ScrollVideoExperience />
    </div>
  );
}
