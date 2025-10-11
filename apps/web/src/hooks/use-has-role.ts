"use client";

import { authClient } from "@/lib/auth-client";

type Role = "student" | "coach" | "admin";

export function useHasRole(required: Role | Role[]) {
  const { data } = authClient.useSession();
  const role = (data?.user as any)?.role as Role | undefined;
  const requiredRoles = Array.isArray(required) ? required : [required];
  const hasRole = role ? requiredRoles.includes(role) : false;
  return { hasRole, role } as const;
}

