"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return <Loader />;
  }

  if (!session) {
    // Redirect in effect; avoid rendering layout content
    return null;
  }

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
