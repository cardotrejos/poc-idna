import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

// Initialize a singleton Pool for the app lifecycle.
export const pool = new Pool({
  connectionString,
  // Optional: parseInt(process.env.PG_MAX ?? "10")
});

export const db = drizzle(pool);
