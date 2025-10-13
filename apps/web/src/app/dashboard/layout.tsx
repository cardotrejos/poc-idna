import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side session check (via API, not local DB)
  const h = await headers();
  const session = await authClient.getSession({
    fetchOptions: { headers: Object.fromEntries(h.entries()) },
  });
  if (!session.data) {
    redirect("/login");
  }

  const user = {
    name: session.data.user.name,
    email: session.data.user.email,
    image: (session.data.user as any).image as string | undefined,
  };

  return (
    <div className="flex min-h-svh">
      <SidebarProvider>
        <AppSidebar user={user} organization={null} />
        <main className="flex-1">
          <div className="sticky top-0 z-10 flex h-14 items-center justify-end gap-2 border-b bg-background px-4">
            <ModeToggle />
            <UserMenu />
          </div>
          <div className="p-6">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
