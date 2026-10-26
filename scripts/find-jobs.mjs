// Finds jobs matching your resume and adds them to the Wishlist.
// Run: npm run jobs:find  
// Needs ADZUNA_APP_ID / ADZUNA_APP_KEY in .env.local (free at developer.adzuna.com);
// without them only RemoteOK is searched.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createClient } from "@libsql/client";
import { buildProfile, findSkills } from "./resume-profile.mjs";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const config = JSON.parse(readFileSync("job-search.config.json", "utf8"));
if (!existsSync("resume-profile.json")) {
  writeFileSync("resume-profile.json", JSON.stringify(await buildProfile(config.resumePath)));
}
const profile = JSON.parse(readFileSync("resume-profile.json", "utf8"));

const db = createClient({
  url: process.env.DATABASE_URL ?? "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const stripHtml = (s = "") => s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
const money = (n) => `$${Math.round(n / 1000)}k`;
const salaryRange = (min, max) =>
  min && max ? `${money(min)}–${money(max)}` : min || max ? money(min || max) : null;

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": "job-tracker/0.1" } });
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`);
  return res.json();
}

async function fromAdzuna() {
  const { ADZUNA_APP_ID: id, ADZUNA_APP_KEY: key } = process.env;
  if (!id || !key) {
    console.log("Adzuna skipped: set ADZUNA_APP_ID and ADZUNA_APP_KEY in .env.local");
    return [];
  }
  const jobs = [];
  for (const title of config.titles) {
    const q = new URLSearchParams({
      app_id: id, app_key: key, results_per_page: "50",
      what: title, where: config.location, max_days_old: String(config.maxAgeDays),
    });
    const data = await getJson(`https://api.adzuna.com/v1/api/jobs/us/search/1?${q}`);
    for (const j of data.results ?? []) {
      jobs.push({
        source: "adzuna", company: j.company?.display_name, role: j.title,
        url: j.redirect_url, location: j.location?.display_name,
        salary: salaryRange(j.salary_min, j.salary_max), text: `${j.title} ${stripHtml(j.description)}`,
      });
    }
  }
  return jobs;
}

async function fromRemoteOk() {
  if (!config.includeRemote) return [];
  const data = await getJson("https://remoteok.com/api");
  const cutoff = Date.now() - config.maxAgeDays * 86_400_000;
  return data
    .filter((j) => j.position && j.url && new Date(j.date).getTime() >= cutoff)
    .map((j) => ({
      source: "remoteok", company: j.company, role: j.position, url: j.url,
      location: "Remote", salary: salaryRange(j.salary_min, j.salary_max),
      text: `${j.position} ${(j.tags ?? []).join(" ")} ${stripHtml(j.description)}`,
    }));
}

// 70%: matched skills out of what the posting asks for (at least 5, so one stray
// keyword can't max it out). 30%: title keywords. Off-topic titles need 4+ skills; excludeTitleWords drops a posting outright.
function score(job) {
  const wanted = findSkills(job.text);
  const have = wanted.filter((s) => profile.skills.includes(s));
  const skillPart = have.length / Math.max(wanted.length, 5);
  const role = job.role.toLowerCase();
  const titleHit = config.titles.some((t) => t.toLowerCase().split(" ").every((w) => role.includes(w)));
  if ((config.excludeTitleWords ?? []).some((w) => role.includes(w))) return 0;
  if (!titleHit && have.length < 4) return 0;
  return Math.round(100 * (0.7 * skillPart + 0.3 * (titleHit ? 1 : 0)));
}

const results = await Promise.allSettled([fromAdzuna(), fromRemoteOk()]);
results.forEach((r) => r.status === "rejected" && console.error("Source failed:", r.reason.message));
const found = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

const seen = new Set((await db.execute("SELECT url FROM seen_jobs")).rows.map((r) => r.url));
const unique = new Map();
for (const job of found) {
  if (!job.company || !job.url || seen.has(job.url) || unique.has(job.url)) continue;
  unique.set(job.url, { ...job, score: score(job) });
}

const now = Math.floor(Date.now() / 1000);
let added = 0;
for (const job of unique.values()) {
  if (job.score < config.minScore) continue;
  // Applications already in the tracker are skipped by the unique url index.
  const res = await db.execute({
    sql: `INSERT OR IGNORE INTO applications
            (company, role, url, location, salary, status, source, match_score, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, 'wishlist', ?, ?, ?, ?)`,
    args: [job.company, job.role, job.url, job.location ?? null, job.salary,
           job.source, job.score, now, now],
  });
  await db.execute({ sql: "INSERT OR IGNORE INTO seen_jobs (url) VALUES (?)", args: [job.url] });
  added += res.rowsAffected;
}
console.log(`${new Date().toISOString()} fetched ${found.length}, added ${added} new matches.`);
