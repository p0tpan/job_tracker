// Reads your resume PDF and saves the skills it mentions to resume-profile.json.
// Run: npm run jobs:profile   (find-jobs.mjs also runs it when the file is missing)
import { readFileSync, writeFileSync } from "node:fs";
import { PDFParse } from "pdf-parse";

// Skills worth matching on. Add terms here to widen what gets picked up.
export const SKILLS = [
  "python", "bash", "powershell", "sql", "mysql", "postgresql", "node.js", "ruby", "go", "javascript",
  "linux", "windows", "macos", "active directory", "vmware", "citrix", "azure", "aws", "google cloud",
  "gcp", "google workspace", "office 365", "microsoft 365", "intune", "okta", "jamf", "servicenow",
  "jira", "zendesk", "dns", "dhcp", "tcp/ip", "vpn", "networking", "cpanel", "wordpress", "lamp",
  "ticketing", "sla", "troubleshooting", "help desk", "service desk", "technical support",
  "system administration", "automation", "multi-factor authentication", "mfa", "saas", "docker",
  "terraform", "ansible", "git", "ci/cd", "kubernetes",
];

// Only word-boundary matches, so "go" doesn't hit "good" and "sql" doesn't hit "mysql".
function mentions(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "i").test(text);
}
export const findSkills = (text) => SKILLS.filter((s) => mentions(text, s));

export async function buildProfile(resumePath) {
  const parser = new PDFParse({ data: readFileSync(resumePath) });
  const { text } = await parser.getText();
  const skills = findSkills(text);
  if (skills.length === 0) throw new Error("No known skills found in the resume.");
  return { skills, builtAt: new Date().toISOString() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = JSON.parse(readFileSync("job-search.config.json", "utf8"));
  const profile = await buildProfile(config.resumePath);
  writeFileSync("resume-profile.json", JSON.stringify(profile, null, 2));
  console.log(`Found ${profile.skills.length} skills:`, profile.skills.join(", "));
}
