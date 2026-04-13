import StudentHeader from "@/components/StudentHeader";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <StudentHeader />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
