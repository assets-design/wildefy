import type { Metadata } from "next";
import { DestinationPage } from "@/components/destination/DestinationPage";

export const metadata: Metadata = {
  title: "Destination — Wildefy",
  description:
    "Kanha Wildlife Escape — a private safari itinerary through Kanha National Park with lodge stays, jeep safaris, and transfers.",
};

export default function DestinationRoute() {
  return <DestinationPage />;
}
