import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { STATUSES } from "../lib/status";

export const applications = sqliteTable(
  "applications",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    company: text("company").notNull(),
    role: text("role").notNull(),
    url: text("url"),
    location: text("location"),
    salary: text("salary"),
    status: text("status", { enum: STATUSES }).notNull().default("wishlist"),
    appliedOn: text("applied_on"), // YYYY-MM-DD
    notes: text("notes"),
    source: text("source"), // set by scripts/find-jobs.mjs, null for manual entries
    matchScore: integer("match_score"), // 0-100 resume keyword match
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (t) => [uniqueIndex("applications_url_unique").on(t.url)],
);

// Every URL the job finder has ever added, so cards you delete don't come back.
export const seenJobs = sqliteTable("seen_jobs", {
  url: text("url").primaryKey(),
});

export type Application = typeof applications.$inferSelect;
