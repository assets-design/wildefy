import { Experiences } from "@/components/experiences/Experiences";
import { Hero } from "@/components/hero/Hero";
import { JourneyShell } from "@/components/journey/JourneyShell";
import { StoryScroll } from "@/components/story/StoryScroll";
import { StoriesGallery } from "@/components/gallery/StoriesGallery";
import { CloudTransition } from "@/components/gallery/CloudTransition";
import { Conservation } from "@/components/gallery/Conservation";
import { AwardsScroll } from "@/components/awards/AwardsScroll";
import { FooterReveal } from "@/components/footer/FooterReveal";

export default function HomePage() {
  return (
    <JourneyShell>
      <Hero />
      <Experiences />
      <StoryScroll />
      <CloudTransition />
      <StoriesGallery />
      {/* Same reusable cloud transition, reversed into the black section. */}
      <CloudTransition />
      <Conservation />
      <AwardsScroll />
      <FooterReveal />
    </JourneyShell>
  );
}
