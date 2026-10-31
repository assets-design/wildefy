import type { Metadata } from "next";
import { AwardsScroll } from "@/components/awards/AwardsScroll";
import { Experiences } from "@/components/experiences/Experiences";
import { FooterReveal } from "@/components/footer/FooterReveal";
import { StoriesGallery } from "@/components/gallery/StoriesGallery";
import { Conservation } from "@/components/gallery/Conservation";
import { ConsAwardsBand } from "@/components/gallery/ConsAwardsBand";
import { Hero } from "@/components/hero/Hero";
import { JourneyShell } from "@/components/journey/JourneyShell";
import { StoryScroll } from "@/components/story/StoryScroll";
import { V2HomeSeam } from "@/components/v2/V2HomeSeam";
import { V2StorySeam } from "@/components/v2/V2StorySeam";

export const metadata: Metadata = {
  title: "Home v2",
  description:
    "Wildlife journeys, wilderness offsites and learning experiences shaped by the field.",
};

/**
 * Sandbox — your cloud asset covers the section join, then scrolls up
 * to reveal the next section. Live `/` is unchanged.
 */
export default function V2Page() {
  return (
    <JourneyShell>
      <Hero birdMode="wings" entrance="fadeUp" />
      <Experiences seamReveal />
      <V2HomeSeam>
        <StoriesGallery />
      </V2HomeSeam>
      <StoryScroll seamReveal />
      <ConsAwardsBand>
        <V2StorySeam>
          <Conservation seamReveal />
        </V2StorySeam>
        <AwardsScroll />
      </ConsAwardsBand>
      <FooterReveal />
    </JourneyShell>
  );
}
