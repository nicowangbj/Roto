import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/admin/strategies" className="text-lg font-bold tracking-tight">
            Rota <span className="text-accent">管理后台</span>
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:text-accent transition-colors">
            返回首页
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
