"use client";

import { startTransition, useOptimistic, useState } from "react";
import { updateStatus } from "@/app/actions";
import type { Application } from "@/db/schema";
import { STATUS_META, STATUSES, type Status } from "@/lib/status";
import { ApplicationCard } from "./ApplicationCard";
import { ApplicationDialog } from "./ApplicationDialog";

export function Board({ applications }: { applications: Application[] }) {
  // Moves show up instantly; the server's fresh data replaces them once
  // updateStatus finishes.
  const [items, moveOptimistic] = useOptimistic(
    applications,
    (state, { id, status }: { id: number; status: Status }) =>
      state.map((a) => (a.id === id ? { ...a, status } : a)),
  );
  const [editing, setEditing] = useState<Application | "new" | null>(null);
  const [dropTarget, setDropTarget] = useState<Status | null>(null);

  function move(id: number, status: Status) {
    const app = items.find((a) => a.id === id);
    if (!app || app.status === status) return;
    startTransition(async () => {
      moveOptimistic({ id, status });
      await updateStatus(id, status);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Stats items={items} />
        <button
          onClick={() => setEditing("new")}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Add application
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map((status) => {
          const column = items.filter((a) => a.status === status);
          return (
            <section
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDropTarget(status);
              }}
              onDragLeave={(e) => {
                // dragleave also fires when moving over a child element.
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDropTarget(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                move(Number(e.dataTransfer.getData("text/plain")), status);
              }}
              className={`rounded-xl border p-3 transition-colors ${
                dropTarget === status
                  ? "border-sky-400 bg-sky-50 dark:bg-sky-950/40"
                  : "border-zinc-200 bg-zinc-100/70 dark:border-zinc-800 dark:bg-zinc-900/60"
              }`}
            >
              <header className="mb-3 flex items-center gap-2 px-1">
                <span
                  className={`size-2 rounded-full ${STATUS_META[status].dot}`}
                />
                <h2 className="text-sm font-semibold">
                  {STATUS_META[status].label}
                </h2>
                <span className="ml-auto text-xs tabular-nums text-zinc-500">
                  {column.length}
                </span>
              </header>
              <ul className="flex min-h-24 flex-col gap-2">
                {column.map((app) => (
                  <li key={app.id}>
                    <ApplicationCard
                      app={app}
                      onEdit={() => setEditing(app)}
                      onMove={(s) => move(app.id, s)}
                    />
                  </li>
                ))}
                {column.length === 0 && (
                  <li className="rounded-lg border border-dashed border-zinc-300 py-6 text-center text-xs text-zinc-400 dark:border-zinc-700">
                    Drop here
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {editing && (
        <ApplicationDialog
          key={editing === "new" ? "new" : editing.id}
          app={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function Stats({ items }: { items: Application[] }) {
  const count = (...statuses: Status[]) =>
    items.filter((a) => statuses.includes(a.status)).length;
  const sent = count("applied", "interview", "offer", "rejected");
  const interviews = count("interview", "offer");

  const stats = [
    { label: "Applications sent", value: sent },
    { label: "In progress", value: count("applied", "interview") },
    {
      label: "Interview rate",
      value: sent ? `${Math.round((interviews / sent) * 100)}%` : "—",
    },
  ];

  return (
    <dl className="flex gap-8">
      {stats.map((s) => (
        <div key={s.label}>
          <dt className="text-xs text-zinc-500">{s.label}</dt>
          <dd className="text-2xl font-semibold tabular-nums">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}
