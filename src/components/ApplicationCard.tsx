"use client";

import type { Application } from "@/db/schema";
import { formatDate, STATUS_META, STATUSES, type Status } from "@/lib/status";

export function ApplicationCard({
  app,
  onEdit,
  onMove,
}: {
  app: Application;
  onEdit: () => void;
  onMove: (status: Status) => void;
}) {
  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(app.id));
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-950"
    >
      <button onClick={onEdit} className="block w-full text-left">
        <p className="truncate font-medium">{app.company}</p>
        <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
          {app.role}
        </p>
      </button>

      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
        {app.source && app.matchScore != null && (
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Auto · {app.matchScore}%
          </span>
        )}
        {app.location && <span>{app.location}</span>}
        {app.salary && <span>{app.salary}</span>}
        {app.appliedOn && app.status !== "wishlist" && (
          <span>Applied {formatDate(app.appliedOn)}</span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Keyboard- and touch-friendly alternative to dragging. */}
        <select
          aria-label={`Move ${app.company} to`}
          value={app.status}
          onChange={(e) => onMove(e.target.value as Status)}
          className="rounded-md border border-zinc-200 bg-transparent px-1.5 py-1 text-xs dark:border-zinc-700"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>
        {app.url && (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-600 hover:underline dark:text-sky-400"
          >
            Posting ↗
          </a>
        )}
      </div>
    </article>
  );
}
