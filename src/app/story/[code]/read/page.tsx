import { redirect } from "next/navigation";
import { getStory } from "@/lib/stories";
import StoryReader from "@/components/StoryReader";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function StoryReadPage({ params }: PageProps) {
  const { code } = await params;
  const story = await getStory(code.toUpperCase());

  if (!story) {
    redirect("/");
  }

  if (story.status === "active") {
    redirect(`/story/${code}`);
  }

  return <StoryReader story={story} />;
}
