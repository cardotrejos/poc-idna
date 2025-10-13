"use client";

import { authClient } from "@/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { orpc } from "@/utils/orpc";

export type Role = "student" | "coach" | "admin";

export function useHasRole(required: Role | Role[]) {
  const session = authClient.useSession();
  const enabled = Boolean(session.data?.user);

  // Fetch server-augmented session (includes role from DB) via oRPC
  const q = useQuery({
    ...orpc.privateData.queryOptions(),
    enabled,
    staleTime: 60_000,
  });

  const role = (q.data?.user as any)?.role as Role | undefined
    ?? (session.data?.user as any)?.role as Role | undefined;

  const requiredRoles = Array.isArray(required) ? required : [required];
  const hasRole = role ? requiredRoles.includes(role) : false;
  const isLoading = enabled && q.isLoading;

  return { hasRole, role, isLoading } as const;
}
