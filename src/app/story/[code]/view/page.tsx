import { redirect } from "next/navigation";
import { getStory } from "@/lib/stories";
import StoryView from "@/components/StoryView";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function StoryViewPage({ params }: PageProps) {
  const { code } = await params;
  const story = await getStory(code);

  if (!story) {
    redirect("/");
  }

  if (story.status === "active") {
    redirect(`/story/${code}`);
  }

  return <StoryView story={story} />;
}