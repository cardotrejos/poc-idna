"use client";

import { authClient } from "@/lib/auth-client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import Loader from "@/components/loader";
import { useHasRole } from "@/hooks/use-has-role";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const { hasRole, isLoading } = useHasRole("admin");

  if (isPending) return <Loader />;
  if (!session?.user) return <div className="p-6">Please sign in.</div>;
  if (isLoading) return <Loader />;
  if (!hasRole) return <div className="p-6">Access denied.</div>;

  const user = {
    name: session.user.name,
    email: session.user.email,
    image: (session.user as any).image as string | undefined,
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
