import SchoolAdminDashboard from "@/components/school/SchoolAdminDashboard";
import { appVariant } from "@/lib/app-variant";
import { redirect } from "next/navigation";

export default async function SchoolAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (appVariant !== "school") {
    redirect(`/${locale}`);
  }

  return <SchoolAdminDashboard />;
}
