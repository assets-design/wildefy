import { Experiences } from "@/components/experiences/Experiences";
import { Hero } from "@/components/hero/Hero";
import { JourneyShell } from "@/components/journey/JourneyShell";
import { StoryScroll } from "@/components/story/StoryScroll";
import { StoriesGallery } from "@/components/gallery/StoriesGallery";
import { Conservation } from "@/components/gallery/Conservation";
import { AwardsScroll } from "@/components/awards/AwardsScroll";
import { FooterReveal } from "@/components/footer/FooterReveal";

export default function HomePage() {
  return (
    <JourneyShell>
      <Hero />
      <Experiences />
      <StoryScroll />
      <StoriesGallery />
      <Conservation />
      <AwardsScroll />
      <FooterReveal />
    </JourneyShell>
  );
}
