import TeacherDashboard from "@/components/school/TeacherDashboard";
import { appVariant } from "@/lib/app-variant";
import { redirect } from "next/navigation";

export default async function SchoolTeacherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (appVariant !== "school") {
    redirect(`/${locale}`);
  }

  return <TeacherDashboard />;
}
