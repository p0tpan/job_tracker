// Fills the local database with sample applications. Run: npm run db:seed
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
};

const samples = [
  ["Northwind Labs", "Junior Backend Engineer", "Remote", "$85k–$100k", "wishlist", null],
  ["Orbital Analytics", "Software Engineer I", "Arlington, VA", "$95k", "wishlist", null],
  ["Bluefin Health", "Associate Software Engineer", "Baltimore, MD", null, "applied", daysAgo(12)],
  ["Cobalt Systems", "Full-Stack Developer", "Remote", "$90k–$110k", "applied", daysAgo(6)],
  ["Harbor Logistics", "Python Developer", "Norfolk, VA", "$80k", "applied", daysAgo(2)],
  ["Summit Robotics", "Software Engineer, Tools", "Pittsburgh, PA", "$105k", "interview", daysAgo(20)],
  ["Lumen Data", "Data Engineer I", "Remote", null, "rejected", daysAgo(30)],
];

const now = Math.floor(Date.now() / 1000);
await db.execute("DELETE FROM applications");
for (const [company, role, location, salary, status, appliedOn] of samples) {
  await db.execute({
    sql: `INSERT INTO applications
            (company, role, location, salary, status, applied_on, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [company, role, location, salary, status, appliedOn, now, now],
  });
}
console.log(`Seeded ${samples.length} applications.`);
