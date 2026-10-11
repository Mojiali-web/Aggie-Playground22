import type { Activity } from "./types";
import { categoryOf } from "./categories";

/** Activity emoji, falling back to its category emoji for activities that have none. */
export function activityEmoji(a: Pick<Activity, "emoji" | "category">): string {
  return a.emoji?.trim() || categoryOf(a.category).emoji;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now.getTime() + 86_400_000).toDateString() === d.toDateString();
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today ${t}`;
  if (tomorrow) return `Tomorrow ${t}`;
  return `${d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })} ${t}`;
}

export function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

export function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function relativeStart(a: Pick<Activity, "starts_at" | "live_status">): string {
  if (a.live_status === "live") return "Happening now";
  const mins = Math.round((new Date(a.starts_at).getTime() - Date.now()) / 60_000);
  if (mins < 1) return "Starting now";
  if (mins < 60) return `In ${mins} min`;
  if (mins < 60 * 24) return `In ${Math.round(mins / 60)}h`;
  return timeLabel(a.starts_at);
}

/** Value for <input type="datetime-local"> in the user's local time. */
export function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
