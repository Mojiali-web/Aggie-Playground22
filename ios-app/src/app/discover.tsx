import { useMemo, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "../lib/AppProvider";
import { CATEGORIES, FORUM_TOPICS, LOCATIONS, SKILL_LEVELS } from "../lib/domain";
import type { Activity, ActivityInput } from "../lib/domain";

type Section = "Activities" | "Clubs" | "Discussions";
const frame = { backgroundColor: "#fffaf0", borderColor: "#29251f", borderWidth: 1.5, borderRadius: 19 } as const;
function signInPrompt() { Alert.alert("Sign in first", "Sign in to join, host, or post.", [{ text: "Not now", style: "cancel" }, { text: "Go to Profile", onPress: () => router.push("/profile") }]); }
function formatWhen(value: string) { return new Date(value).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { user, profile, activities, joinedIds, posts, clubs, loading, dataError, join, leave, cancel, host, updateActivity, addPost, refreshClubs } = useApp();
  const [section, setSection] = useState<Section>("Activities");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [hosting, setHosting] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState(CATEGORIES[0].name);
  const [subcategory, setSubcategory] = useState(CATEGORIES[0].subcategories[0]);
  const [locationKey, setLocationKey] = useState(LOCATIONS[2].key);
  const [startChoice, setStartChoice] = useState("In 30 min");
  const [maxPeople, setMaxPeople] = useState("10");
  const [durationMin, setDurationMin] = useState(60);
  const [skillLevel, setSkillLevel] = useState("All Levels");
  const [vibe, setVibe] = useState("");
  const [whatToBring, setWhatToBring] = useState("");
  const [busy, setBusy] = useState(false);
  const [topic, setTopic] = useState(FORUM_TOPICS[1]);
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [notice, setNotice] = useState("");

  const filtered = useMemo(() => activities.filter((a) => {
    const matchesText = `${a.title} ${a.location_name} ${a.description} ${a.subcategory}`.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All" || a.category === category;
    const matchesStatus = status === "All" || a.live_status === (status === "Live" ? "live" : "upcoming");
    return matchesText && matchesCategory && matchesStatus;
  }), [activities, category, query, status]);
  const recommended = useMemo(() => profile?.favorite_categories.length ? activities.filter((a) => profile.favorite_categories.includes(a.category) && a.spots_remaining > 0).slice(0, 4) : [], [activities, profile]);

  function openHostForm() {
    if (!user) return signInPrompt();
    setEditingActivity(null); setTitle(""); setDescription(""); setCategoryName(CATEGORIES[0].name);
    setSubcategory(CATEGORIES[0].subcategories[0]); setLocationKey(LOCATIONS[2].key);
    setStartChoice("In 30 min"); setMaxPeople("10"); setDurationMin(60); setSkillLevel("All Levels"); setVibe(""); setWhatToBring("");
    setHosting(true);
  }
  function openEditForm(activity: Activity) {
    setEditingActivity(activity); setTitle(activity.title); setDescription(activity.description);
    setCategoryName(activity.category); setSubcategory(activity.subcategory); setLocationKey(activity.location_key);
    setStartChoice("Keep current time"); setMaxPeople(String(activity.max_participants)); setDurationMin(activity.duration_min);
    setSkillLevel(activity.skill_level ?? "All Levels"); setVibe(activity.vibe ?? ""); setWhatToBring(activity.what_to_bring ?? ""); setHosting(true);
  }

  async function createActivity() {
    if (!user) return signInPrompt();
    if (title.trim().length < 3) return Alert.alert("Add a title", "Activity titles need at least 3 characters.");
    const cap = Number(maxPeople);
    if (!Number.isInteger(cap) || cap < 2 || cap > 200) return Alert.alert("Check the group size", "Choose between 2 and 200 people.");
    const start = editingActivity && startChoice === "Keep current time" ? new Date(editingActivity.starts_at) : new Date();
    if (startChoice === "In 30 min") start.setMinutes(start.getMinutes() + 30);
    else if (startChoice === "In 1 hour") start.setHours(start.getHours() + 1);
    else if (startChoice === "Tomorrow") { start.setDate(start.getDate() + 1); start.setHours(10, 0, 0, 0); }
    const loc = LOCATIONS.find((l) => l.key === locationKey) ?? LOCATIONS[0];
    const isSport = categoryName === "Competitive Sports" || categoryName === "Recreational Sports";
    const payload: ActivityInput = { title: title.trim(), category: categoryName, subcategory, location_key: loc.key, location_name: loc.name, lat: loc.lat, lng: loc.lng, starts_at: start.toISOString(), duration_min: durationMin, max_participants: cap, description: description.trim(), skill_level: isSport ? skillLevel : null, vibe: vibe || null, what_to_bring: whatToBring.trim() || null };
    setBusy(true);
    const error = editingActivity ? await updateActivity(editingActivity.id, payload) : await host(payload);
    setBusy(false);
    if (error) return Alert.alert(editingActivity ? "Couldn't save activity" : "Couldn't host activity", error);
    setHosting(false); setEditingActivity(null); setTitle(""); setDescription(""); setNotice(editingActivity ? "Activity changes saved." : "Your activity is live and saved to WoCow.");
  }

  async function createPost() {
    if (!user) return signInPrompt();
    if (postTitle.trim().length < 3) return Alert.alert("Add a title", "Discussion titles need at least 3 characters.");
    const error = await addPost(topic, postTitle, postBody);
    if (error) return Alert.alert("Couldn't post", error);
    setPostTitle(""); setPostBody(""); setNotice("Your post was added.");
  }

  async function activityAction(a: Activity) {
    if (!user) return signInPrompt();
    const error = joinedIds.has(a.id) ? await leave(a.id) : await join(a.id);
    if (error) Alert.alert(joinedIds.has(a.id) ? "Couldn't leave" : "Couldn't join", error.replaceAll("_", " "));
  }

  function chip(label: string, active: boolean, onPress: () => void) {
    return <Pressable key={label} onPress={onPress} style={[styles.chip, active && styles.activeChip]}><Text style={styles.chipText}>{label}</Text></Pressable>;
  }
  function activityCard(a: Activity) {
    const mine = a.host_id === user?.id;
    const attending = joinedIds.has(a.id);
    const catEmoji = CATEGORIES.find((c) => c.name === a.category)?.emoji ?? "✨";
    return <View key={a.id} style={styles.card}>
      <View style={styles.cardTop}><Text style={styles.bigEmoji}>{catEmoji}</Text><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{a.title}</Text><Text style={styles.meta}>{formatWhen(a.starts_at)} · {a.location_name}</Text></View></View>
      {!!a.description && <Text style={styles.body}>{a.description}</Text>}
      {(a.skill_level || a.vibe || a.what_to_bring) && <Text style={styles.meta}>{[a.skill_level, a.vibe && `Vibe: ${a.vibe}`, a.what_to_bring && `Bring: ${a.what_to_bring}`].filter(Boolean).join(" · ")}</Text>}
      <Text style={styles.meta}>{a.host_emoji ?? "🐮"} {a.host_name ?? "Aggie"} · {a.participant_count}/{a.max_participants} going · {a.spots_remaining} spots left · {a.live_status === "live" ? "🔴 Live now" : "⏰ Upcoming"}</Text>
      <View style={styles.actionRow}>{mine ? <><Pressable style={[styles.action, styles.neutral]} onPress={() => openEditForm(a)}><Text style={styles.actionText}>Edit</Text></Pressable><Pressable style={[styles.action, styles.neutral]} onPress={() => Alert.alert("Cancel activity?", "Everyone who joined will be notified.", [{ text: "Keep it", style: "cancel" }, { text: "Cancel activity", style: "destructive", onPress: async () => { const error = await cancel(a.id); if (error) Alert.alert("Couldn't cancel", error); } }])}><Text style={styles.actionText}>Cancel</Text></Pressable></> : <Pressable disabled={!attending && a.spots_remaining < 1} onPress={() => void activityAction(a)} style={[styles.action, attending ? styles.neutral : styles.joinAction, !attending && a.spots_remaining < 1 && { opacity: 0.5 }]}><Text style={styles.actionText}>{attending ? "Leave" : a.spots_remaining < 1 ? "Full" : "Join"}</Text></Pressable>}</View>
    </View>;
  }

  return <View style={styles.screen}><ScrollView contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: 28, paddingHorizontal: 16 }}>
    <Text style={styles.eyebrow}>🐮 AGGIE PLAYGROUND</Text><Text style={styles.heading}>Discover</Text><Text style={styles.sub}>Find your people and see what’s happening on campus.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{(["Activities", "Clubs", "Discussions"] as Section[]).map((s) => chip(s, section === s, () => { setSection(s); setNotice(""); }))}</ScrollView>
    {!!notice && <Pressable onPress={() => setNotice("")} style={styles.notice}><Text style={styles.noticeText}>✓ {notice}</Text></Pressable>}

    {section === "Activities" && <>
      <TextInput value={query} onChangeText={setQuery} placeholder="Search activities and places…" placeholderTextColor="#81786c" style={styles.input} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{["All", ...CATEGORIES.map((c) => c.name)].map((c) => chip(c, category === c, () => setCategory(c)))}</ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{["All", "Live", "Upcoming"].map((s) => chip(s, status === s, () => setStatus(s)))}</ScrollView>
      {recommended.length > 0 && <><Text style={styles.sectionTitle}>✨ Picked for your interests</Text>{recommended.map(activityCard)}</>}
      <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Activities</Text><Pressable onPress={openHostForm} style={styles.hostButton}><Text style={styles.hostText}>＋ Host</Text></Pressable></View>
      {!!dataError && <View style={styles.notice}><Text style={styles.noticeText}>Couldn’t load WoCow data: {dataError}</Text></View>}
      {loading ? <Text style={styles.empty}>Loading activities…</Text> : filtered.length ? filtered.map(activityCard) : <View style={styles.card}><Text style={styles.cardTitle}>Nothing matches yet</Text><Text style={styles.body}>Try another filter or host an activity for other Aggies.</Text></View>}
    </>}

    {section === "Clubs" && <>
      <Text style={styles.sectionTitle}>🎪 Campus Clubs</Text><Text style={styles.sub}>Official events from AggieLife, fetched by your existing Context.dev server integration.</Text>
      <Pressable onPress={async () => { setBusy(true); const result = await refreshClubs(); setBusy(false); setNotice(result ?? "Club events updated."); }} disabled={busy} style={styles.refreshButton}><Text style={styles.hostText}>{busy ? "Refreshing…" : "↻ Refresh from AggieLife"}</Text></Pressable>
      {clubs.length ? clubs.map((event) => <View key={event.id} style={styles.card}><Text style={styles.badge}>OFFICIAL CLUB EVENT</Text><Text style={styles.cardTitle}>{event.title}</Text>{event.organization && <Text style={styles.meta}>🏛️ {event.organization}</Text>}<Text style={styles.meta}>🕒 {event.starts_at ? formatWhen(event.starts_at) : "Date on original page"}</Text>{event.location && <Text style={styles.meta}>📍 {event.location}</Text>}{event.description && <Text style={styles.body}>{event.description}</Text>}<Pressable onPress={() => void Linking.openURL(event.event_url)} style={styles.linkButton}><Text style={styles.actionText}>View original event ↗</Text></Pressable></View>) : <View style={styles.card}><Text style={styles.cardTitle}>No club events loaded</Text><Text style={styles.body}>Refresh pulls from the existing website API. The deployed website address and its server keys must be configured for this action.</Text></View>}
    </>}

    {section === "Discussions" && <>
      <Text style={styles.sectionTitle}>💬 Student Discussions</Text>
      <View style={styles.card}><Text style={styles.meta}>Choose a topic</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{FORUM_TOPICS.map((t) => chip(t, topic === t, () => setTopic(t)))}</ScrollView><TextInput value={postTitle} onChangeText={setPostTitle} placeholder="Start a conversation…" maxLength={120} style={styles.input} /><TextInput value={postBody} onChangeText={setPostBody} placeholder="Add details (optional)" multiline style={[styles.input, styles.multiline]} /><Pressable onPress={() => void createPost()} style={styles.hostButton}><Text style={styles.hostText}>Post</Text></Pressable></View>
      {posts.length ? posts.map((p) => <View key={p.id} style={styles.card}><Text style={styles.badge}>{p.topic}</Text><Text style={styles.cardTitle}>{p.title}</Text>{p.body ? <Text style={styles.body}>{p.body}</Text> : null}<Text style={styles.meta}>{p.author?.avatar_emoji ?? "🐮"} {p.author?.display_name ?? "Aggie"} · {formatWhen(p.created_at)}</Text></View>) : <View style={styles.card}><Text style={styles.body}>No posts yet. Be the first to start a conversation.</Text></View>}
    </>}
  </ScrollView>

  {hosting && <View style={styles.scrim}><View style={styles.modal}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 10 }}>
    <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{editingActivity ? "Edit activity" : "Host an activity"}</Text><Pressable onPress={() => { setHosting(false); setEditingActivity(null); }}><Text style={styles.close}>✕</Text></Pressable></View>
    <TextInput value={title} onChangeText={setTitle} placeholder="Activity title" maxLength={80} style={styles.input} />
    <Text style={styles.formLabel}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{CATEGORIES.map((c) => chip(c.name, categoryName === c.name, () => { setCategoryName(c.name); setSubcategory(c.subcategories[0]); }))}</ScrollView>
    <Text style={styles.formLabel}>Activity</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{(CATEGORIES.find((c) => c.name === categoryName)?.subcategories ?? []).map((s) => chip(s, subcategory === s, () => setSubcategory(s)))}</ScrollView>
    <Text style={styles.formLabel}>Meeting spot</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>{LOCATIONS.map((l) => chip(l.name, locationKey === l.key, () => setLocationKey(l.key)))}</ScrollView>
    <Text style={styles.formLabel}>Starts</Text><View style={styles.row}>{[...(editingActivity ? ["Keep current time"] : []), "In 30 min", "In 1 hour", "Tomorrow"].map((s) => chip(s, startChoice === s, () => setStartChoice(s)))}</View>
    <Text style={styles.formLabel}>Duration</Text><View style={styles.row}>{[...new Set([30, 60, 90, 120, ...(editingActivity ? [editingActivity.duration_min] : [])])].map((m) => chip(`${m} min`, durationMin === m, () => setDurationMin(m)))}</View>
    {(categoryName === "Competitive Sports" || categoryName === "Recreational Sports") && <><Text style={styles.formLabel}>Skill level</Text><View style={styles.row}>{SKILL_LEVELS.map((s) => chip(s, skillLevel === s, () => setSkillLevel(s)))}</View></>}
    <Text style={styles.formLabel}>Vibe</Text><View style={styles.row}>{["", "Chill", "Energetic", "Focused", "Silly", "Wholesome"].map((s) => chip(s || "Any", vibe === s, () => setVibe(s)))}</View>
    <TextInput value={maxPeople} onChangeText={setMaxPeople} placeholder="Max people (2–200)" keyboardType="number-pad" style={styles.input} />
    <TextInput value={description} onChangeText={setDescription} placeholder="Details (optional)" multiline style={[styles.input, styles.multiline]} />
    <TextInput value={whatToBring} onChangeText={setWhatToBring} placeholder="What to bring (optional)" style={styles.input} />
    <View style={styles.row}><Pressable onPress={() => { setHosting(false); setEditingActivity(null); }} style={[styles.action, styles.neutral]}><Text style={styles.actionText}>Not now</Text></Pressable><Pressable disabled={busy} onPress={() => void createActivity()} style={[styles.action, styles.joinAction]}><Text style={styles.actionText}>{busy ? "Saving…" : editingActivity ? "Save changes" : "Create activity"}</Text></Pressable></View>
  </ScrollView></View></View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#e7efe4" }, eyebrow: { color: "#526b51", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, heading: { marginTop: 6, color: "#29251f", fontSize: 34, fontWeight: "900", letterSpacing: -1 }, sub: { marginTop: 3, marginBottom: 14, color: "#655e54", fontSize: 13, lineHeight: 19, fontWeight: "600" }, row: { flexDirection: "row", gap: 7, marginBottom: 11 }, chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 99, backgroundColor: "#fffaf0", borderWidth: 1.2, borderColor: "#d7cfc2" }, activeChip: { backgroundColor: "#ffdc62", borderColor: "#29251f" }, chipText: { color: "#29251f", fontSize: 11, fontWeight: "800" }, input: { ...frame, marginBottom: 10, paddingHorizontal: 13, paddingVertical: 11, color: "#29251f", fontSize: 14 }, multiline: { minHeight: 68, textAlignVertical: "top" }, sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 3, marginBottom: 9 }, sectionTitle: { marginTop: 5, marginBottom: 9, color: "#29251f", fontSize: 19, fontWeight: "900" }, hostButton: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#ffdc62", borderWidth: 1.5, borderColor: "#29251f", borderRadius: 14 }, hostText: { color: "#29251f", fontWeight: "900" }, card: { ...frame, marginBottom: 10, padding: 14 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 10 }, bigEmoji: { fontSize: 26 }, cardTitle: { color: "#29251f", fontSize: 15, fontWeight: "900" }, meta: { marginTop: 7, color: "#746b5f", fontSize: 11, lineHeight: 16, fontWeight: "700" }, body: { marginTop: 8, color: "#514b43", fontSize: 13, lineHeight: 18, fontWeight: "600" }, actionRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }, action: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, borderWidth: 1.4, borderColor: "#29251f" }, joinAction: { backgroundColor: "#d5eccd" }, neutral: { backgroundColor: "#fff" }, actionText: { color: "#29251f", fontWeight: "900", fontSize: 12 }, sectionHeaderAction: { flexDirection: "row", alignItems: "center" }, refreshButton: { marginBottom: 12, padding: 12, alignItems: "center", backgroundColor: "#e7ddff", borderColor: "#29251f", borderWidth: 1.4, borderRadius: 14 }, badge: { alignSelf: "flex-start", marginBottom: 7, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, backgroundColor: "#e7ddff", color: "#29251f", fontSize: 9, fontWeight: "900" }, linkButton: { alignSelf: "flex-start", marginTop: 10, padding: 9, backgroundColor: "#ffdc62", borderWidth: 1.3, borderColor: "#29251f", borderRadius: 12 }, empty: { padding: 20, color: "#655e54", textAlign: "center", fontWeight: "700" }, notice: { marginBottom: 10, padding: 10, backgroundColor: "#d5eccd", borderRadius: 12 }, noticeText: { color: "#31583c", fontSize: 12, fontWeight: "800" }, scrim: { ...StyleSheet.absoluteFill, justifyContent: "center", padding: 14, backgroundColor: "#0008" }, modal: { maxHeight: "92%", padding: 16, backgroundColor: "#fffaf0", borderWidth: 1.5, borderColor: "#29251f", borderRadius: 22 }, close: { fontSize: 22, fontWeight: "900", color: "#29251f" }, formLabel: { marginBottom: 7, color: "#29251f", fontSize: 12, fontWeight: "900" },
});
