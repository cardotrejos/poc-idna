"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";
import { useHasRole } from "@/hooks/use-has-role";

export default function Header() {
    const pathname = usePathname();

    // Hide global header on dashboard/admin/coach pages (these have their own top bar)
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin") || pathname.startsWith("/coach")) return null;

    const { hasRole: isAdmin } = useHasRole("admin");
    const { hasRole: isCoach } = useHasRole("coach");
    return (
        <header className="border-b">
            <div className="flex items-center justify-between px-4 py-3">
                <Link aria-label="Home" className="font-semibold text-lg" href="/">
                    id<span className="text-primary">na</span>
                </Link>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Link className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent" href="/admin/students" aria-label="Admin: Students">
                            Admin
                        </Link>
                    )}
                    {isCoach && (
                        <Link className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent" href="/coach/students" aria-label="Coach: Students">
                            Coach
                        </Link>
                    )}
                    <ModeToggle />
                    <UserMenu />
                </div>
            </div>
        </header>
    );
}
