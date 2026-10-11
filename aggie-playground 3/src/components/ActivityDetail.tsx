"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase/client";
import { categoryOf } from "@/lib/categories";
import { activityEmoji, durationLabel, timeLabel } from "@/lib/format";
import { useActivities } from "./ActivitiesProvider";
import { CategoryTag, JoinButton, StatusBadge } from "./ActivityCard";
import { useUI } from "./UIProvider";

interface Person {
  id: string;
  display_name: string;
  avatar_emoji: string;
  avatar_color: string;
  is_demo: boolean;
  major?: string | null;
  class_year?: string | null;
}

export function ActivityDetail() {
  const { detailId, closeDetail } = useUI();
  const { activities } = useActivities();
  const a = detailId ? activities.find((x) => x.id === detailId) : undefined;
  if (!detailId) return null;
  if (!a) return <GoneNotice onClose={closeDetail} />;
  return <Detail key={a.id} activityId={a.id} onClose={closeDetail} />;
}

function GoneNotice({ onClose }: { onClose: () => void }) {
  return (
    <Overlay onClose={onClose} label="Activity unavailable">
      <p className="font-display text-xl font-bold">This activity is no longer available</p>
      <p className="font-semibold text-ink/75">It may have ended or been cancelled.</p>
      <button onClick={onClose} className="sticker-sm pop mt-4 rounded-2xl bg-sun px-4 py-2 font-display font-bold">Close</button>
    </Overlay>
  );
}

function Overlay({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[2500] flex items-end justify-center bg-ink/50 sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="slide-up sticker max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-cream p-5 outline-none sm:rounded-3xl">
        {children}
      </div>
    </div>
  );
}

function Detail({ activityId, onClose }: { activityId: string; onClose: () => void }) {
  const { activities } = useActivities();
  const a = activities.find((x) => x.id === activityId)!;
  const [people, setPeople] = useState<Person[] | null>(null);
  const count = a.participant_count;

  // Load who's going; refetch whenever the live participant count changes.
  useEffect(() => {
    if (!supabaseConfigured) return;
    let cancelled = false;
    (async () => {
      const sb = getSupabase();
      const { data: rows } = await sb.from("participants").select("user_id, joined_at").eq("activity_id", activityId).order("joined_at", { ascending: true });
      const ids = (rows ?? []).map((r: { user_id: string }) => r.user_id);
      if (!ids.length) return !cancelled && setPeople([]);
      const { data: profs } = await sb.from("public_profiles").select("id, display_name, avatar_emoji, avatar_color, is_demo, major, class_year").in("id", ids);
      const byId = new Map(((profs ?? []) as Person[]).map((p) => [p.id, p]));
      if (!cancelled) setPeople(ids.map((id: string) => byId.get(id)).filter((p): p is Person => Boolean(p)));
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, count]);

  const c = categoryOf(a.category);
  return (
    <Overlay onClose={onClose} label={`${a.title} details`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <CategoryTag name={a.category} sub={a.subcategory} />
          <StatusBadge a={a} />
          {a.is_demo && <span title="Fictional demo activity" className="rounded-full border-2 border-dashed border-ink px-2 py-0.5 text-xs font-extrabold">DEMO</span>}
        </div>
        <button onClick={onClose} className="sticker-sm pop grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white font-black" aria-label="Close details">✕</button>
      </div>

      <h2 className="mt-3 font-display text-3xl font-bold leading-tight">
        <span aria-hidden="true">{activityEmoji(a)}</span> {a.title}
      </h2>

      <dl className="mt-3 grid gap-1.5 text-sm font-bold text-ink/85 sm:grid-cols-2">
        <div><dt className="sr-only">Host</dt><dd>{a.host_emoji ?? "🐮"} Hosted by {a.host_name ?? "an Aggie"}</dd></div>
        <div><dt className="sr-only">Location</dt><dd>📍 {a.location_name}</dd></div>
        <div><dt className="sr-only">When</dt><dd>🕒 {timeLabel(a.starts_at)}</dd></div>
        <div><dt className="sr-only">Duration</dt><dd>⏱ {durationLabel(a.duration_min)}</dd></div>
        {a.skill_level && <div><dt className="sr-only">Level</dt><dd>🎯 {a.skill_level}</dd></div>}
        {a.vibe && <div><dt className="sr-only">Vibe</dt><dd>✨ {a.vibe}</dd></div>}
      </dl>

      {a.description && (
        <section className="mt-4">
          <h3 className="font-display text-lg font-bold">About</h3>
          <p className="whitespace-pre-wrap font-semibold text-ink/80">{a.description}</p>
        </section>
      )}

      {a.meeting_instructions && (
        <section className="sticker-sm mt-4 rounded-2xl bg-sun/60 p-3">
          <h3 className="font-display text-lg font-bold">📌 Where to meet</h3>
          <p className="whitespace-pre-wrap font-semibold">{a.meeting_instructions}</p>
        </section>
      )}

      {a.what_to_bring && (
        <section className="mt-3">
          <h3 className="font-display text-lg font-bold">🎒 What to bring</h3>
          <p className="font-semibold text-ink/80">{a.what_to_bring}</p>
        </section>
      )}

      <section className="mt-4" aria-labelledby="who">
        <div className="flex items-baseline justify-between">
          <h3 id="who" className="font-display text-lg font-bold">Who&apos;s going</h3>
          <span className="text-sm font-extrabold">
            {a.participant_count} / {a.max_participants} · {a.spots_remaining === 0 ? "Full" : `${a.spots_remaining} spot${a.spots_remaining === 1 ? "" : "s"} left`}
          </span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full border-2 border-ink bg-white" aria-hidden="true">
          <div className="h-full transition-all duration-500" style={{ width: `${Math.min(100, (a.participant_count / a.max_participants) * 100)}%`, background: c.color }} />
        </div>
        {people === null ? (
          <p className="mt-2 text-sm font-semibold text-ink/60">Loading…</p>
        ) : people.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-ink/60">No one yet. Be the first to join!</p>
        ) : (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {people.map((p) => (
              <li key={p.id} className="sticker-sm flex items-center gap-2 rounded-2xl bg-white p-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink text-lg" style={{ background: p.avatar_color }}>{p.avatar_emoji}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold">
                    {p.display_name}{p.id === a.host_id && <span className="ml-1 rounded-full border-2 border-ink bg-lavender px-1.5 text-[10px]">HOST</span>}
                  </span>
                  {(p.class_year || p.major) && <span className="block truncate text-xs font-bold text-ink/60">{[p.class_year, p.major].filter(Boolean).join(" · ")}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="sticker-sm pop rounded-2xl bg-white px-4 py-2 font-display font-bold">Close</button>
        <JoinButton a={a} />
      </div>
    </Overlay>
  );
}
