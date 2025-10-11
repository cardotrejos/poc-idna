import test from "node:test";
import assert from "node:assert/strict";
import { assertAuthenticated, assertRole, assertSelfOrAdmin } from "../src/guards";

const ctx = (role?: "student" | "coach" | "admin", id: string = "u1") =>
  ({ session: role ? { user: { id, role } } : undefined } as any);

test("assertAuthenticated allows when session exists", () => {
  assert.doesNotThrow(() => assertAuthenticated(ctx("student")));
});

test("assertAuthenticated throws when no session", () => {
  assert.throws(() => assertAuthenticated(ctx(undefined)), /UNAUTHORIZED/);
});

test("assertRole allows matching role", () => {
  assert.doesNotThrow(() => assertRole(ctx("admin"), "admin"));
});

test("assertRole forbids non-matching role", () => {
  assert.throws(() => assertRole(ctx("coach"), "admin"), /FORBIDDEN/);
});

test("assertSelfOrAdmin allows self", async () => {
  await assert.doesNotReject(() => assertSelfOrAdmin(ctx("student", "u1"), "u1"));
});

test("assertSelfOrAdmin allows admin", async () => {
  await assert.doesNotReject(() => assertSelfOrAdmin(ctx("admin", "u2"), "u1"));
});

test("assertSelfOrAdmin forbids other student", async () => {
  await assert.rejects(() => assertSelfOrAdmin(ctx("student", "u2"), "u1"));
});

