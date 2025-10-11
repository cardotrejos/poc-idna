CREATE TYPE "public"."user_role" AS ENUM('student', 'coach', 'admin');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'student' NOT NULL;