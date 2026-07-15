import { redirect } from "next/navigation";
import { appVariant } from "@/lib/app-variant";

export default async function LegacyTeacherPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (appVariant !== "school") {
    redirect(`/${locale}`);
  }

  redirect(`/${locale}/school/teacher`);
}
