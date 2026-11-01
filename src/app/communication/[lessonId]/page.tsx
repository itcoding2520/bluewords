import { SituationalEnglishLesson } from "@/components/communication/SituationalEnglishLesson";

export default async function SituationalEnglishLessonPage({ params, searchParams }: PageProps<"/communication/[lessonId]">) {
  const [{ lessonId }, { reviewItem }] = await Promise.all([params, searchParams]);
  return <SituationalEnglishLesson lessonId={lessonId} reviewItem={Array.isArray(reviewItem) ? reviewItem[0] : reviewItem} />;
}
