import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as ExpoLinking from "expo-linking";
import type { Session, User } from "@supabase/supabase-js";
import { apiBaseUrl, supabase, supabaseConfigured } from "./backend";
import type { Activity, ActivityInput, ClubEvent, Post, Profile } from "./domain";

type AppContextValue = {
  user: User | null; profile: Profile | null; authLoading: boolean; configured: boolean;
  signInWithEmail: (email: string) => Promise<string | null>; signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>; saveProfile: (patch: Partial<Profile>) => Promise<string | null>;
  activities: Activity[]; joinedIds: Set<string>; posts: Post[]; clubs: ClubEvent[]; loading: boolean;
  dataError: string | null;
  refresh: () => Promise<void>; join: (id: string) => Promise<string | null>; leave: (id: string) => Promise<string | null>;
  host: (data: ActivityInput) => Promise<string | null>; updateActivity: (id: string, data: ActivityInput) => Promise<string | null>;
  cancel: (id: string) => Promise<string | null>; addPost: (topic: string, title: string, body: string) => Promise<string | null>;
  refreshClubs: () => Promise<string | null>;
};
const AppContext = createContext<AppContextValue | null>(null);
export function useApp() { const value = useContext(AppContext); if (!value) throw new Error("useApp must be used inside AppProvider"); return value; }

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<Post[]>([]);
  const [clubs, setClubs] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const loadProfile = useCallback(async (target: User | null) => {
    if (!target) { setProfile(null); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", target.id).maybeSingle();
    setProfile((data as Profile | null) ?? null);
  }, []);

  useEffect(() => {
    let alive = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setUser(data.session?.user ?? null);
      await loadProfile(data.session?.user ?? null);
      if (alive) setAuthLoading(false);
    });
    const { data: auth } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
      // Defer database work outside the auth callback to avoid holding the auth lock.
      setTimeout(() => { if (alive) void loadProfile(session?.user ?? null); }, 0);
    });
    return () => { alive = false; auth.subscription.unsubscribe(); };
  }, [loadProfile]);

  const signInWithEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: ExpoLinking.createURL("auth/callback") },
    });
    return error?.message ?? null;
  }, []);
  const signOut = useCallback(async () => { await supabase.auth.signOut(); setUser(null); setProfile(null); }, []);
  const refreshProfile = useCallback(async () => loadProfile(user), [loadProfile, user]);
  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    if (!user) return "Sign in to save your profile.";
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    if (error) return error.message;
    await loadProfile(user); return null;
  }, [loadProfile, user]);

  const refresh = useCallback(async () => {
    if (!supabaseConfigured) { setLoading(false); return; }
    const [{ data, error }, { data: mine }, { data: postRows }, { data: clubRows }] = await Promise.all([
      supabase.from("activity_feed").select("*").neq("live_status", "cancelled").neq("live_status", "ended").order("starts_at", { ascending: true }),
      user ? supabase.from("participants").select("activity_id").eq("user_id", user.id) : Promise.resolve({ data: [] as { activity_id: string }[] }),
      supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("club_events").select("*").order("starts_at", { ascending: true, nullsFirst: false }).limit(60),
    ]);
    if (error) setDataError(error.message);
    else { setDataError(null); setActivities((data ?? []) as Activity[]); }
    setJoinedIds(new Set((mine ?? []).map((row: { activity_id: string }) => row.activity_id)));
    const list = (postRows ?? []) as Post[];
    const authorIds = [...new Set(list.map((post) => post.author_id))];
    const { data: authorRows } = authorIds.length
      ? await supabase.from("public_profiles").select("id,display_name,avatar_emoji").in("id", authorIds)
      : { data: [] };
    const authors = new Map((authorRows ?? []).map((row: { id: string; display_name: string; avatar_emoji: string }) => [row.id, row]));
    setPosts(list.map((post) => ({ ...post, author: authors.get(post.author_id) ?? null })));
    setClubs((clubRows ?? []) as ClubEvent[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch populates the remote activity and feed data
    void refresh();
    if (!supabaseConfigured) return;
    const channel = supabase.channel("native-aggie-playground")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void refresh())
      .subscribe();
    const timer = setInterval(() => void refresh(), 60_000);
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [refresh]);

  const join = useCallback(async (id: string) => {
    if (!user) return "Sign in to join an activity.";
    const { error } = await supabase.rpc("join_activity", { p_activity_id: id });
    await refresh(); return error?.message ?? null;
  }, [refresh, user]);
  const leave = useCallback(async (id: string) => {
    if (!user) return "Sign in to leave an activity.";
    const { error } = await supabase.rpc("leave_activity", { p_activity_id: id });
    await refresh(); return error?.message ?? null;
  }, [refresh, user]);
  const host = useCallback(async (data: ActivityInput) => {
    if (!user) return "Sign in to host an activity.";
    const { error } = await supabase.from("activities").insert({ ...data, host_id: user.id });
    await refresh(); return error?.message ?? null;
  }, [refresh, user]);
  const updateActivity = useCallback(async (id: string, data: ActivityInput) => {
    if (!user) return "Sign in to edit an activity.";
    const { error } = await supabase.from("activities").update(data).eq("id", id).eq("host_id", user.id);
    await refresh(); return error?.message ?? null;
  }, [refresh, user]);
  const cancel = useCallback(async (id: string) => {
    if (!user) return "Sign in to cancel an activity.";
    const { error } = await supabase.from("activities").update({ status: "cancelled" }).eq("id", id).eq("host_id", user.id);
    await refresh(); return error?.message ?? null;
  }, [refresh, user]);
  const addPost = useCallback(async (topic: string, title: string, body: string) => {
    if (!user) return "Sign in to post.";
    const { error } = await supabase.from("posts").insert({ author_id: user.id, topic, title: title.trim(), body: body.trim() });
    await refresh(); return error?.message ?? null;
  }, [refresh, user]);
  const refreshClubs = useCallback(async () => {
    if (!user) return "Sign in to refresh club events.";
    if (!apiBaseUrl) return "Set EXPO_PUBLIC_API_URL to your deployed website address to refresh events.";
    const { data } = await supabase.auth.getSession();
    try {
      const response = await fetch(`${apiBaseUrl}/api/clubs/refresh`, { method: "POST", headers: { Authorization: `Bearer ${data.session?.access_token ?? ""}` } });
      const body = await response.json().catch(() => ({}));
      await refresh();
      if (!response.ok) return body.error ?? body.results?.[0]?.error ?? "The server could not refresh club events.";
      const result = body.results?.[0];
      return result?.throttled ? "Already refreshed recently; showing the latest saved events." : `Found ${result?.stored ?? 0} upcoming club events.`;
    } catch { return "Could not reach the club events server."; }
  }, [refresh, user]);

  const value = useMemo<AppContextValue>(() => ({
    user, profile, authLoading, configured: supabaseConfigured, signInWithEmail, signOut, refreshProfile, saveProfile,
    activities, joinedIds, posts, clubs, loading, dataError, refresh, join, leave, host, updateActivity, cancel, addPost, refreshClubs,
  }), [user, profile, authLoading, signInWithEmail, signOut, refreshProfile, saveProfile, activities, joinedIds, posts, clubs, loading, dataError, refresh, join, leave, host, updateActivity, cancel, addPost, refreshClubs]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
