import type { Metadata } from "next";
import { PhotoCloud } from "@/components/gallery/PhotoCloud";

export const metadata: Metadata = {
  title: "Gallery — Wildefy",
  description:
    "Wildlife photographs by Hymakar Valluri — cheetahs, lions, rhinos, and birds from the field.",
};

export default function GalleryRoute() {
  return <PhotoCloud />;
}
