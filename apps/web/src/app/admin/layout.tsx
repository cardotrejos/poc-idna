import { authClient } from "@/lib/auth-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data } = authClient.useSession();
  const role = (data?.user as any)?.role;
  if (!data?.user) return <div className="p-6">Please sign in.</div>;
  if (role !== "admin") return <div className="p-6">Access denied.</div>;
  return <div className="p-6">{children}</div>;
}
