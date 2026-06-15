import StudentHeader from "@/components/StudentHeader";
import { Suspense } from "react";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <Suspense fallback={null}>
        <StudentHeader />
      </Suspense>
      <main className="max-w-[1300px] mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
