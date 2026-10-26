import type { Metadata } from "next";
import { ScrollVideoExperience } from "@/components/cinematic/ScrollVideoExperience";

export const metadata: Metadata = {
  title: "Mountain — Wildefy",
  description: "A silent, scroll-driven cinematic passage through the Wildefy mountain.",
};

export default function Wildefy3DRoute() {
  return <ScrollVideoExperience />;
}
