import type { Metadata } from "next";
import { AwardsScroll } from "@/components/awards/AwardsScroll";
import { Experiences } from "@/components/experiences/Experiences";
import { ExperiencesCloudHandoff } from "@/components/experiences/ExperiencesCloudHandoff";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { StoriesGallery } from "@/components/gallery/StoriesGallery";
import { Conservation } from "@/components/gallery/Conservation";
import { GalleryAwardsBand } from "@/components/gallery/GalleryAwardsBand";
import { Hero } from "@/components/hero/Hero";
import { JourneyShell } from "@/components/journey/JourneyShell";
import { StoryCloudHandoff } from "@/components/story/StoryCloudHandoff";
import { StoryScroll } from "@/components/story/StoryScroll";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Wildlife journeys, wilderness offsites and learning experiences shaped by the field.",
};

/** Main site homepage (formerly /lander). */
export default function HomePage() {
  return (
    <JourneyShell>
      <Hero birdMode="wings" entrance="fadeUp" />
      {/* Hero→§2 uses dual clouds-section.png; §2→§3 same handoff */}
      <Experiences seamReveal />
      <ExperiencesCloudHandoff>
        <GalleryAwardsBand>
          <StoriesGallery />
          <StoryScroll seamReveal />
          {/* Same clouds-section.png handoff; soft veil — meadow plate keeps scrubbing */}
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
