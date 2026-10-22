import { Experiences } from "@/components/experiences/Experiences";
import { Hero } from "@/components/hero/Hero";
import { JourneyShell } from "@/components/journey/JourneyShell";
import { StoryScroll } from "@/components/story/StoryScroll";

export default function HomePage() {
  return (
    <JourneyShell>
      <Hero />
      <Experiences />
      <StoryScroll />
    </JourneyShell>
  );
}
