"use client";

import { authClient } from "@/lib/auth-client";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const { data } = authClient.useSession();
  const role = (data?.user as any)?.role;
  if (!data?.user) return <div className="p-6">Please sign in.</div>;
  if (role !== "coach" && role !== "admin") return <div className="p-6">Access denied.</div>;
  return (
    <div className="p-6 space-y-4">
      <nav className="flex gap-4 text-sm" aria-label="Coach">
        <a className="underline" href="/coach/students">Students</a>
      </nav>
      {children}
    </div>
  );
}

