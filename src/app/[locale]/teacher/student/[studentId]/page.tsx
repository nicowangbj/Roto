import { redirect } from "next/navigation";
import { appVariant } from "@/lib/app-variant";

export default async function LegacyTeacherStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; studentId: string }>;
  searchParams: Promise<{ classId?: string }>;
}) {
  const { locale, studentId } = await params;
  if (appVariant !== "school") {
    redirect(`/${locale}`);
  }

  const { classId } = await searchParams;
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  redirect(`/${locale}/school/teacher/student/${studentId}${query}`);
}
