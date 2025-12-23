import { requireAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-orange-50/50">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="lg:pl-64">
        <Header
          user={{
            email: user.email,
            name: user.name || undefined,
          }}
        />

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
