import TeacherStudentDetail from "@/components/school/TeacherStudentDetail";
import { appVariant } from "@/lib/app-variant";
import { redirect } from "next/navigation";

export default async function SchoolTeacherStudentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (appVariant !== "school") {
    redirect(`/${locale}`);
  }

  return <TeacherStudentDetail />;
}
