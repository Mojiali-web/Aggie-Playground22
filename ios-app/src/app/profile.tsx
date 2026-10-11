import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../lib/AppProvider";
import { CATEGORIES } from "../lib/domain";
import type { AppNotification } from "../lib/domain";
import { supabase } from "../lib/backend";

const EMOJIS = ["🐮", "😎", "🤓", "🏐", "🏀", "🥏", "🎨", "📚", "💪", "🧋", "🌻", "🚴"];
const COLORS = ["#ffd84d", "#7cc4ff", "#7ed68a", "#ff8fa3", "#b9a4ff", "#ffb454"];

export default function ProfileScreen() {
  const inset = useSafeAreaInsets();
  const { user, profile, authLoading, signInWithEmail, signOut, saveProfile, activities, joinedIds } = useApp();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [bio, setBio] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [discoverable, setDiscoverable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!profile) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate the editable form from the signed-in student's profile
    setName(profile.display_name); setEmoji(profile.avatar_emoji); setColor(profile.avatar_color);
    setBio(profile.bio); setFavorites(profile.favorite_categories); setPreferences(profile.preferred_activities); setDiscoverable(profile.discoverable);
  }, [profile]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear private notifications when the signed-in user changes
    if (!user) { setNotes([]); return; }
    const loadNotes = async () => {
      const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
      setNotes((data ?? []) as AppNotification[]);
    };
    void loadNotes();
    const channel = supabase.channel(`native-notes-${user.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => void loadNotes()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const subcategories = useMemo(() => CATEGORIES.filter((c) => favorites.includes(c.name)).flatMap((c) => c.subcategories), [favorites]);
  const hosted = activities.filter((a) => a.host_id === user?.id);
  const joined = activities.filter((a) => joinedIds.has(a.id) && a.host_id !== user?.id);
  const unread = notes.filter((n) => !n.read).length;
  const toggle = (items: string[], value: string) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value];

  async function sendLink() {
    if (!email.includes("@")) return Alert.alert("Check your email", "Enter a valid email address.");
    setSending(true); setMessage("");
    const error = await signInWithEmail(email);
    setSending(false);
    setMessage(error ? `Could not send link: ${error}` : `Sign-in link sent to ${email}. Open it on this iPhone to finish signing in.`);
  }
  async function save() {
    setSaving(true);
    const error = await saveProfile({ display_name: name.trim() || "Aggie", avatar_emoji: emoji, avatar_color: color, bio: bio.trim(), favorite_categories: favorites, preferred_activities: preferences.filter((p) => subcategories.includes(p)), discoverable });
    setSaving(false);
    Alert.alert(error ? "Couldn't save profile" : "Profile saved", error ?? "Your changes are saved to WoCow.");
  }
  async function markRead(id?: string) {
    const update = supabase.from("notifications").update({ read: true }).eq("user_id", user!.id);
    const { error } = id ? await update.eq("id", id) : await update.eq("read", false);
    if (error) return Alert.alert("Couldn't update notification", error.message);
    setNotes((current) => current.map((note) => !id || note.id === id ? { ...note, read: true } : note));
  }

  if (authLoading) return <View style={styles.screen}><Text style={styles.loading}>Loading your profile…</Text></View>;
  if (!user) return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: inset.top + 24, paddingHorizontal: 20, paddingBottom: 28 }}><Text style={styles.eyebrow}>🐮 YOUR SPACE</Text><Text style={styles.heading}>Welcome, Aggie</Text><Text style={styles.sub}>Sign in with your email to join activities, find buddies, and save your profile.</Text><View style={styles.card}><Text style={styles.label}>UC Davis email</Text><TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@ucdavis.edu" style={styles.input} /><Pressable disabled={sending} onPress={() => void sendLink()} style={styles.saveButton}><Text style={styles.saveText}>{sending ? "Sending…" : "Email me a sign-in link"}</Text></Pressable>{!!message && <Text style={styles.info}>{message}</Text>}<Text style={styles.hint}>The link opens back into this app. If it opens a browser instead, add `aggieplayground://auth/callback` to the Supabase Auth redirect URL allowlist.</Text></View></ScrollView>;

  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: inset.top + 17, paddingHorizontal: 16, paddingBottom: 30 }}>
    <Text style={styles.eyebrow}>🐮 YOUR SPACE</Text><Text style={styles.heading}>My Profile</Text><Text style={styles.sub}>{user.email ?? "Signed in"} · Your email stays private.</Text>
    <View style={styles.card}><View style={styles.profileHeader}><View style={[styles.avatar, { backgroundColor: color }]}><Text style={{ fontSize: 28 }}>{emoji}</Text></View><View style={{ flex: 1 }}><Text style={styles.profileName}>{name || "Aggie"}</Text><Text style={styles.hint}>Edit your profile and interests</Text></View></View>
      <Text style={styles.label}>Avatar</Text><View style={styles.row}>{EMOJIS.map((e) => <Pressable key={e} onPress={() => setEmoji(e)} style={[styles.emoji, emoji === e && styles.active]}><Text style={{ fontSize: 21 }}>{e}</Text></Pressable>)}</View><View style={[styles.row, { marginTop: 8 }]}>{COLORS.map((c) => <Pressable key={c} accessibilityLabel={`Avatar color ${c}`} onPress={() => setColor(c)} style={[styles.color, { backgroundColor: c }, color === c && styles.active]} />)}</View>
      <Text style={styles.label}>Display name</Text><TextInput value={name} onChangeText={setName} maxLength={40} style={styles.input} />
      <Text style={styles.label}>Bio</Text><TextInput value={bio} onChangeText={setBio} maxLength={200} multiline placeholder="Major, vibe, what you're into…" style={[styles.input, styles.multiline]} />
      <Text style={styles.label}>Favorite categories</Text><View style={styles.row}>{CATEGORIES.map((c) => <Pressable key={c.name} onPress={() => { const next = toggle(favorites, c.name); setFavorites(next); setPreferences(preferences.filter((p) => next.flatMap((name) => CATEGORIES.find((item) => item.name === name)?.subcategories ?? []).includes(p))); }} style={[styles.pill, favorites.includes(c.name) && styles.active]}><Text style={styles.pillText}>{c.emoji} {c.name}</Text></Pressable>)}</View>
      {subcategories.length > 0 && <><Text style={styles.label}>Preferred activities</Text><View style={styles.row}>{subcategories.map((item) => <Pressable key={item} onPress={() => setPreferences(toggle(preferences, item))} style={[styles.pill, preferences.includes(item) && styles.active]}><Text style={styles.pillText}>{item}</Text></Pressable>)}</View></>}
      <Pressable onPress={() => setDiscoverable(!discoverable)} style={styles.opt}><Text style={styles.check}>{discoverable ? "☑" : "□"}</Text><Text style={styles.hint}>Let other students find me in Matching Buddies. Off by default.</Text></Pressable>
      <View style={styles.buttonRow}><Pressable onPress={() => void save()} disabled={saving} style={[styles.saveButton, { flex: 1 }]}><Text style={styles.saveText}>{saving ? "Saving…" : "Save profile"}</Text></Pressable><Pressable onPress={() => void signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable></View>
    </View>

    <View style={styles.sectionHeader}><Text style={styles.section}>🔔 Notifications {unread > 0 ? `(${unread})` : ""}</Text>{unread > 0 && <Pressable onPress={() => void markRead()}><Text style={styles.link}>Mark all read</Text></Pressable>}</View>
    {notes.length === 0 ? <View style={styles.card}><Text style={styles.hint}>All quiet. You’ll see activity updates and new activities matching your favorites here.</Text></View> : notes.map((note) => <Pressable key={note.id} onPress={() => { if (!note.read) void markRead(note.id); }} style={[styles.card, !note.read && styles.unread]}><Text style={styles.notificationTitle}>{note.title}</Text><Text style={styles.hint}>{note.body}</Text><Text style={styles.timestamp}>{new Date(note.created_at).toLocaleString()}</Text></Pressable>)}
    <Text style={styles.section}>📅 Your Activities</Text>{[...hosted.map((a) => ({ ...a, tag: "Hosting" })), ...joined.map((a) => ({ ...a, tag: "Joined" }))].map((a) => <View key={`${a.tag}-${a.id}`} style={styles.activity}><Text style={styles.pillText}>{a.tag === "Hosting" ? "🏠" : "🙌"} {a.tag} · {a.title}</Text><Text style={styles.timestamp}>{a.location_name} · {new Date(a.starts_at).toLocaleString()}</Text></View>)}{hosted.length + joined.length === 0 && <View style={styles.card}><Text style={styles.hint}>Your hosted and joined activities will show up here.</Text></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#e7efe4" }, loading: { marginTop: 100, textAlign: "center", color: "#655e54", fontWeight: "800" }, eyebrow: { color: "#526b51", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, heading: { marginTop: 6, color: "#29251f", fontSize: 32, fontWeight: "900", letterSpacing: -1 }, sub: { marginTop: 4, marginBottom: 14, color: "#655e54", fontSize: 13, lineHeight: 19, fontWeight: "600" }, card: { marginBottom: 11, padding: 15, backgroundColor: "#fffaf0", borderColor: "#29251f", borderWidth: 1.4, borderRadius: 19 }, profileHeader: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 8 }, avatar: { width: 56, height: 56, alignItems: "center", justifyContent: "center", borderRadius: 18 }, profileName: { color: "#29251f", fontSize: 19, fontWeight: "900" }, label: { marginTop: 12, marginBottom: 6, color: "#29251f", fontSize: 12, fontWeight: "900" }, input: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff", borderColor: "#d7cfc2", borderWidth: 1.2, borderRadius: 12, color: "#29251f", fontSize: 14 }, multiline: { minHeight: 65, textAlignVertical: "top" }, row: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, emoji: { width: 40, height: 40, alignItems: "center", justifyContent: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#d7cfc2", borderRadius: 13 }, color: { width: 29, height: 29, borderWidth: 1, borderColor: "#938879", borderRadius: 99 }, active: { borderColor: "#29251f", borderWidth: 2.2, backgroundColor: "#ffdc62" }, pill: { paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#fff", borderColor: "#d7cfc2", borderWidth: 1, borderRadius: 99 }, pillText: { color: "#29251f", fontSize: 11, fontWeight: "800" }, opt: { marginTop: 14, padding: 10, flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#f3eddd", borderRadius: 12 }, check: { color: "#29251f", fontSize: 20 }, hint: { flex: 1, color: "#655e54", fontSize: 11, lineHeight: 16, fontWeight: "600" }, buttonRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }, saveButton: { marginTop: 12, padding: 12, alignItems: "center", backgroundColor: "#ffdc62", borderWidth: 1.4, borderColor: "#29251f", borderRadius: 13 }, saveText: { color: "#29251f", fontSize: 12, fontWeight: "900" }, signOut: { marginTop: 12, padding: 12, borderWidth: 1.4, borderColor: "#29251f", borderRadius: 13, backgroundColor: "#fff" }, signOutText: { color: "#29251f", fontSize: 12, fontWeight: "900" }, info: { marginTop: 10, color: "#31583c", fontSize: 12, lineHeight: 18, fontWeight: "800" }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, section: { marginTop: 13, marginBottom: 8, color: "#29251f", fontSize: 18, fontWeight: "900" }, link: { marginTop: 12, color: "#31583c", fontSize: 11, fontWeight: "900", textDecorationLine: "underline" }, unread: { backgroundColor: "#fff3c3" }, notificationTitle: { color: "#29251f", fontSize: 13, fontWeight: "900" }, timestamp: { marginTop: 5, color: "#746b5f", fontSize: 10, fontWeight: "700" }, activity: { marginBottom: 8, padding: 12, backgroundColor: "#fffaf0", borderColor: "#d7cfc2", borderWidth: 1, borderRadius: 14 },
});
