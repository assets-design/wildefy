import type { Metadata } from "next";
import { AboutPage } from "@/components/about/AboutPage";

export const metadata: Metadata = {
  title: "About Us — Wildefy",
  description:
    "From the Wild, for the World. Hymakar Valluri’s journey from corporate finance to six continents of wildlife leadership.",
};

export default function AboutRoute() {
  return <AboutPage />;
}
