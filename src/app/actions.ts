"use server";

// Server Actions run on the server but can be called straight from the UI.
// Anyone can POST to them, so every input is validated here, never trusted.

import { eq, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { isStatus, type Status } from "@/lib/status";

export type FormState = {
  ok?: boolean;
  error?: string;
  // What the user submitted, so the form can refill itself after an error.
  values?: Record<string, string>;
};

function today() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

// Only http(s) links, so a saved "javascript:..." URL can't run code when clicked.
function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function field(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

// Creates an application, or updates one when the form includes an id.
export async function saveApplication(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const company = field(formData, "company");
  const role = field(formData, "role");
  const status = field(formData, "status") ?? "wishlist";
  const url = field(formData, "url");

  const fail = (error: string): FormState => ({
    error,
    values: Object.fromEntries(
      [...formData].filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
  });

  if (!company || !role) return fail("Company and role are required.");
  if (!isStatus(status)) return fail("Unknown status.");
  if (url && !isHttpUrl(url)) {
    return fail("Link must start with http:// or https://");
  }

  const values = {
    company,
    role,
    status,
    url,
    location: field(formData, "location"),
    salary: field(formData, "salary"),
    notes: field(formData, "notes"),
    appliedOn:
      field(formData, "appliedOn") ?? (status === "wishlist" ? null : today()),
  };

  const id = Number(field(formData, "id"));
  if (id) {
    await db.update(applications).set(values).where(eq(applications.id, id));
  } else {
    await db.insert(applications).values(values);
  }
  refresh();
  return { ok: true };
}

export async function updateStatus(id: number, status: Status) {
  if (!Number.isInteger(id) || !isStatus(status)) {
    throw new Error("Invalid status update.");
  }
  await db
    .update(applications)
    .set({
      status,
      // The first move out of Wishlist stamps today as the applied date.
      ...(status !== "wishlist" && {
        appliedOn: sql`coalesce(${applications.appliedOn}, ${today()})`,
      }),
    })
    .where(eq(applications.id, id));
  refresh();
}

export async function deleteApplication(id: number) {
  if (!Number.isInteger(id)) throw new Error("Invalid id.");
  await db.delete(applications).where(eq(applications.id, id));
  refresh();
}
