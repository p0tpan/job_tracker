"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  deleteApplication,
  saveApplication,
  type FormState,
} from "@/app/actions";
import type { Application } from "@/db/schema";
import { STATUS_META, STATUSES } from "@/lib/status";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-900";

// Adds a new application when app is null, otherwise edits app.
export function ApplicationDialog({
  app,
  onClose,
}: {
  app: Application | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveApplication,
    {},
  );

  // React resets the form after each submit. After a failed submit, refill
  // it with what the user typed instead of the saved values.
  const value = (name: keyof Application): string =>
    state.values?.[name] ?? String(app?.[name] ?? "");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  function remove() {
    if (!app || !confirm(`Delete ${app.company}?`)) return;
    startTransition(async () => {
      await deleteApplication(app.id);
      onClose();
    });
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dialog element itself (not its contents) is a backdrop click.
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-full max-w-lg rounded-xl bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/40 dark:bg-zinc-950 dark:text-zinc-100"
    >
      <form action={formAction} className="flex flex-col gap-4 p-6">
        <h2 className="text-lg font-semibold">
          {app ? "Edit application" : "Add application"}
        </h2>
        {app && <input type="hidden" name="id" value={app.id} />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Company *">
            <input
              name="company"
              required
              autoFocus
              defaultValue={value("company")}
              className={inputClass}
            />
          </Field>
          <Field label="Role *">
            <input
              name="role"
              required
              defaultValue={value("role")}
              className={inputClass}
            />
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={value("status") || "wishlist"}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Applied on">
            <input
              type="date"
              name="appliedOn"
              defaultValue={value("appliedOn")}
              className={inputClass}
            />
          </Field>
          <Field label="Location">
            <input
              name="location"
              defaultValue={value("location")}
              placeholder="Remote"
              className={inputClass}
            />
          </Field>
          <Field label="Salary">
            <input
              name="salary"
              defaultValue={value("salary")}
              placeholder="$90k–$110k"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Job posting link">
          <input
            type="url"
            name="url"
            defaultValue={value("url")}
            placeholder="https://"
            className={inputClass}
          />
        </Field>
        <Field label="Notes">
          <textarea
            name="notes"
            rows={3}
            defaultValue={value("notes")}
            className={inputClass}
          />
        </Field>

        {state.error && (
          <p role="alert" className="text-sm text-rose-600">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-2">
          {app && (
            <button
              type="button"
              onClick={remove}
              className="text-sm text-rose-600 hover:underline"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-zinc-700 dark:text-zinc-300">
        {label}
      </span>
      {children}
    </label>
  );
}
