import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import StoriesClient from "./StoriesClient";

export default async function StoriesPage() {
  const h = await headers();
  const session = await authClient.getSession({ fetchOptions: { headers: Object.fromEntries(h.entries()) } });
  if (!session.data) redirect("/login");

  return (
    <div className="space-y-2">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Life Stories</h1>
        <p className="text-muted-foreground">Capture moments that shaped you. Drafts autosave when you click “Save”.</p>
      </header>
      <StoriesClient />
    </div>
  );
}

