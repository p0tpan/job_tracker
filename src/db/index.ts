import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Locally this is a SQLite file. In production, point DATABASE_URL at a
// hosted libSQL database (e.g. Turso) without changing any code.
export const db = drizzle({
  connection: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
  schema,
});
