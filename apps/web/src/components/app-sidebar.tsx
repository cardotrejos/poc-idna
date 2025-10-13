"use client";

import { LayoutDashboard, Bot, LogOut, FileText, FolderOpen, Shield, Users } from "lucide-react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useHasRole } from "@/hooks/use-has-role";

import type { Route } from "next";

const navItems: { title: string; href: Route; icon: any }[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Assessments", href: "/dashboard/assessments", icon: FileText },
  { title: "Documents", href: "/dashboard/documents", icon: FolderOpen },
  { title: "AI Chat", href: "/ai", icon: Bot },
];

export function AppSidebar({
  user,
  organization,
}: {
  user: { name: string; email: string; image?: string | null };
  organization?: { name: string; logo?: string | null } | null;
}) {
  const pathname = usePathname();
  const { hasRole: isAdmin } = useHasRole("admin");
  const { hasRole: isCoach } = useHasRole("coach");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="px-4 py-3 font-semibold text-sm">id<span className="text-primary">na</span></div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Staff sections: show when user has matching role */}
        {(isCoach || isAdmin) && (
          <SidebarGroup>
            <SidebarGroupLabel>Staff</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isCoach && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === "/coach/students" || pathname.startsWith("/coach/students/")}>
                      <Link href={"/coach/students" as Route}>
                        <Users className="h-4 w-4" />
                        <span>Coach • Students</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {isAdmin && (
                  <>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/admin/assessments" || pathname.startsWith("/admin/assessments/")}>
                        <Link href={"/admin/assessments" as Route}>
                          <Shield className="h-4 w-4" />
                          <span>Admin • Assessments</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/admin/students" || pathname.startsWith("/admin/students/")}>
                        <Link href={"/admin/students" as Route}>
                          <Users className="h-4 w-4" />
                          <span>Admin • Students</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 hover:bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-muted-foreground max-w-[160px] truncate">{user.email}</span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => authClient.signOut()}> 
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
