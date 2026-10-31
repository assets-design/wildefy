import type { Metadata } from "next";
import { Experiences } from "@/components/experiences/Experiences";
import { ExperiencesCloudHandoff } from "@/components/experiences/ExperiencesCloudHandoff";
import { Hero } from "@/components/hero/Hero";
import { JourneyShell } from "@/components/journey/JourneyShell";
import { StoryCloudHandoff } from "@/components/story/StoryCloudHandoff";
import { StoryScroll } from "@/components/story/StoryScroll";
import { StoriesGallery } from "@/components/gallery/StoriesGallery";
import { Conservation } from "@/components/gallery/Conservation";
import { GalleryAwardsBand } from "@/components/gallery/GalleryAwardsBand";
import { AwardsScroll } from "@/components/awards/AwardsScroll";
import { FooterReveal } from "@/components/footer/FooterReveal";

export const metadata: Metadata = {
  title: "H2",
  description:
    "Wildlife journeys, wilderness offsites and learning experiences shaped by the field.",
};

/** Previous homepage — kept at /h2 */
export default function H2Page() {
  return (
    <JourneyShell>
      <Hero birdMode="wings" />
      <Experiences seamReveal />
      <ExperiencesCloudHandoff>
        <GalleryAwardsBand>
          <StoriesGallery />
          <StoryScroll seamReveal />
          <StoryCloudHandoff>
            <Conservation seamReveal />
          </StoryCloudHandoff>
          <AwardsScroll />
        </GalleryAwardsBand>
      </ExperiencesCloudHandoff>
      <FooterReveal />
    </JourneyShell>
  );
}
