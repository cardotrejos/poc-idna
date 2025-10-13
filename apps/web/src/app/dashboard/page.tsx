import { redirect } from "next/navigation";
import Dashboard from "./dashboard";
import { headers } from "next/headers";
import { authClient } from "@/lib/auth-client";
import { JourneyDashboardShell } from "@/components/journey/JourneyDashboardShell";

export default async function DashboardPage() {
  const h = await headers();
  const session = await authClient.getSession({
    fetchOptions: { headers: Object.fromEntries(h.entries()) },
  });

  if (!session.data) {
    redirect("/login");
  }

  return (
    <div className="space-y-8" aria-labelledby="journey-heading">
      <header className="flex flex-col gap-2">
        <h1 id="journey-heading" className="text-2xl font-semibold">
          Welcome, {session.data.user.name}
        </h1>
        <p className="text-muted-foreground">Track your progress and jump back into the next step.</p>
      </header>

      <JourneyDashboardShell />

      <section className="pt-2 border-t" aria-label="Assessment results">
        <Dashboard session={session.data} />
      </section>
    </div>
  );
}
