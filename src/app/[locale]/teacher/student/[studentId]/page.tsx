import { redirect } from "next/navigation";

export default async function LegacyTeacherStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; studentId: string }>;
  searchParams: Promise<{ classId?: string }>;
}) {
  const { locale, studentId } = await params;
  const { classId } = await searchParams;
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  redirect(`/${locale}/school/teacher/student/${studentId}${query}`);
}
