import { headers } from "next/headers";
import { redirect } from "next/navigation";
import LoginPageClient from "@/components/login-page";
import { authClient } from "@/lib/auth-client";

export default async function LoginPage() {
  const h = await headers();
  const requestHeaders = Object.fromEntries(h.entries());
  const session = await authClient.getSession({
    fetchOptions: { headers: requestHeaders },
  });
  if (session.data) {
    redirect("/dashboard");
  }
  return <LoginPageClient />;
}
