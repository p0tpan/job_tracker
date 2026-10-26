import { desc } from "drizzle-orm";
import { connection } from "next/server";
import { Suspense } from "react";
import { Board } from "@/components/Board";
import { db } from "@/db";
import { applications } from "@/db/schema";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Job Tracker</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drag cards between columns as your applications move along.
        </p>
      </header>
      <Suspense fallback={<BoardSkeleton />}>
        <BoardData />
      </Suspense>
    </main>
  );
}

async function BoardData() {
  await connection(); // read fresh data on every request, never at build time
  const rows = await db
    .select()
    .from(applications)
    .orderBy(desc(applications.updatedAt));
  return <Board applications={rows} />;
}

function BoardSkeleton() {
  return (
    <div className="mt-20 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-64 animate-pulse rounded-xl bg-zinc-200/70 dark:bg-zinc-800/60"
        />
      ))}
    </div>
  );
}
