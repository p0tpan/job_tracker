// Kept free of server-only imports so client components can use it too.

export const STATUSES = [
  "wishlist",
  "applied",
  "interview",
  "offer",
  "rejected",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_META: Record<Status, { label: string; dot: string }> = {
  wishlist: { label: "Wishlist", dot: "bg-zinc-400" },
  applied: { label: "Applied", dot: "bg-sky-500" },
  interview: { label: "Interview", dot: "bg-amber-500" },
  offer: { label: "Offer", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", dot: "bg-rose-500" },
};

export function isStatus(value: unknown): value is Status {
  return STATUSES.includes(value as Status);
}

// "2026-10-03" -> "Oct 3". Built from the parts so the date doesn't shift
// across time zones the way new Date("2026-10-03") would.
export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
