import { redirect } from "next/navigation";
import { getStory } from "@/lib/stories";
import { getWordLimits } from "@/lib/config";
import StoryEditor from "@/components/StoryEditor";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function StoryPage({ params }: PageProps) {
  const { code } = await params;

  const story = getStory(code);

  if (!story) {
    redirect("/");
  }

  if (story.status === "completed") {
    redirect(`/story/${code}/view`);
  }

  const wordLimits = getWordLimits();

  return <StoryEditor story={story} wordLimits={wordLimits} />;
}
