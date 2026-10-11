import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/backend";
import { useApp } from "../lib/AppProvider";
import type { BuddyRequest, Profile } from "../lib/domain";

function matchScore(me: Profile, other: Profile) {
  const categories = other.favorite_categories.filter((item) => me.favorite_categories.includes(item));
  const activities = other.preferred_activities.filter((item) => me.preferred_activities.includes(item));
  return { categories, activities, total: categories.length + 2 * activities.length };
}
export default function BuddiesScreen() {
  const inset = useSafeAreaInsets();
  const { user, profile } = useApp();
  const [people, setPeople] = useState<Profile[]>([]);
  const [requests, setRequests] = useState<BuddyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!user) { setPeople([]); setRequests([]); setLoading(false); return; }
    setLoading(true); setError("");
    const [profiles, reqs] = await Promise.all([
      supabase.from("public_profiles").select("*").eq("discoverable", true).neq("id", user.id).limit(100),
      supabase.from("buddy_requests").select("*").or(`from_user.eq.${user.id},to_user.eq.${user.id}`),
    ]);
    if (profiles.error || reqs.error) setError(profiles.error?.message ?? reqs.error?.message ?? "Could not load matches.");
    setPeople((profiles.data ?? []) as Profile[]); setRequests((reqs.data ?? []) as BuddyRequest[]); setLoading(false);
  }, [user]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load initial remote data after the screen mounts
    void load();
  }, [load]);

  const ranked = useMemo(() => profile ? people.map((person) => ({ person, score: matchScore(profile, person) })).sort((a, b) => b.score.total - a.score.total) : [], [people, profile]);
  const incoming = requests.filter((r) => r.to_user === user?.id && r.status === "pending");
  const buddies = requests.filter((r) => r.status === "accepted");
  const getRelation = (id: string) => requests.find((r) => (r.from_user === user?.id && r.to_user === id) || (r.to_user === user?.id && r.from_user === id));

  async function connect(id: string) {
    const { error: err } = await supabase.from("buddy_requests").insert({ from_user: user!.id, to_user: id });
    if (err && !err.message.toLowerCase().includes("duplicate")) Alert.alert("Couldn't connect", err.message);
    else if (!err) Alert.alert("Request sent", "Your buddy request was sent.");
    await load();
  }
  async function respond(id: string, response: "accepted" | "declined") {
    const { error: err } = await supabase.from("buddy_requests").update({ status: response }).eq("id", id).eq("to_user", user!.id);
    if (err) Alert.alert("Couldn't update request", err.message);
    await load();
  }

  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: inset.top + 18, paddingHorizontal: 17, paddingBottom: 28 }}>
    <Text style={styles.eyebrow}>🤝 MEET AGGIES</Text><Text style={styles.heading}>Matching Buddies</Text><Text style={styles.sub}>Find study partners, teammates, and friends with shared interests.</Text>
    {!user ? <View style={styles.notice}><Text style={styles.noticeTitle}>Sign in to find buddies</Text><Text style={styles.body}>Matching uses profiles from the WoCow database. Your profile is hidden by default; choose whether you want to be discoverable in Profile.</Text><Pressable onPress={() => router.push("/profile")} style={styles.button}><Text style={styles.buttonText}>Go to Profile to sign in</Text></Pressable></View> : <>
      {!profile?.discoverable && <View style={styles.notice}><Text style={styles.noticeTitle}>You’re hidden right now</Text><Text style={styles.body}>Turn on discoverability in your Profile if you want other students to find you.</Text></View>}
      {!!error && <View style={styles.notice}><Text style={styles.body}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Try again</Text></Pressable></View>}
      {incoming.length > 0 && <><Text style={styles.section}>📬 Requests for you</Text>{incoming.map((request) => { const person = people.find((p) => p.id === request.from_user); return <View key={request.id} style={styles.card}><Text style={styles.name}>{person?.avatar_emoji ?? "🐮"} {person?.display_name ?? "An Aggie"} wants to connect</Text><View style={styles.row}><Pressable onPress={() => void respond(request.id, "accepted")} style={styles.button}><Text style={styles.buttonText}>Accept</Text></Pressable><Pressable onPress={() => void respond(request.id, "declined")} style={[styles.button, styles.secondary]}><Text style={styles.buttonText}>Decline</Text></Pressable></View></View>; })}</>}
      {buddies.length > 0 && <><Text style={styles.section}>🎉 Your buddies</Text>{buddies.map((request) => { const id = request.from_user === user.id ? request.to_user : request.from_user; const person = people.find((p) => p.id === id); return <View key={request.id} style={styles.buddy}><Text style={styles.name}>{person?.avatar_emoji ?? "🐮"} {person?.display_name ?? "Aggie"}</Text></View>; })}</>}
      <View style={styles.sectionHead}><Text style={styles.section}>People who share your interests</Text><Pressable onPress={() => void load()}><Text style={styles.link}>Refresh</Text></Pressable></View>
      {loading ? <Text style={styles.body}>Finding Aggies…</Text> : ranked.length === 0 ? <View style={styles.card}><Text style={styles.name}>No matches yet</Text><Text style={styles.body}>More students will show up here when they opt in to matching.</Text></View> : ranked.map(({ person, score }) => {
        const relation = getRelation(person.id);
        return <View key={person.id} style={styles.card}><View style={styles.personTop}><View style={[styles.avatar, { backgroundColor: person.avatar_color }]}><Text style={{ fontSize: 24 }}>{person.avatar_emoji}</Text></View><View style={{ flex: 1 }}><Text style={styles.name}>{person.display_name}</Text>{person.bio ? <Text style={styles.body}>{person.bio}</Text> : null}</View><Text style={styles.score}>{score.total} shared</Text></View><Text style={styles.meta}>Shared interests</Text><Text style={styles.body}>{[...score.categories, ...score.activities].join(" · ") || "Explore campus together"}</Text>
          {relation ? <Text style={styles.relation}>{relation.status === "accepted" ? "Buddies ✓" : relation.status === "declined" ? "Request declined" : relation.from_user === user.id ? "Request sent" : "Wants to connect"}</Text> : <Pressable onPress={() => void connect(person.id)} style={styles.button}><Text style={styles.buttonText}>Connect</Text></Pressable>}
        </View>;
      })}
    </>}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#e7efe4" }, eyebrow: { color: "#526b51", fontSize: 11, fontWeight: "900", letterSpacing: 1 }, heading: { marginTop: 6, color: "#29251f", fontSize: 31, fontWeight: "900", letterSpacing: -1 }, sub: { marginTop: 4, marginBottom: 16, color: "#655e54", fontSize: 13, lineHeight: 19, fontWeight: "600" }, notice: { marginBottom: 15, padding: 15, backgroundColor: "#ffedab", borderColor: "#29251f", borderWidth: 1.5, borderRadius: 19 }, noticeTitle: { color: "#29251f", fontSize: 15, fontWeight: "900" }, sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, section: { marginTop: 12, marginBottom: 9, color: "#29251f", fontSize: 18, fontWeight: "900" }, card: { marginBottom: 10, padding: 14, backgroundColor: "#fffaf0", borderColor: "#29251f", borderWidth: 1.4, borderRadius: 19 }, personTop: { flexDirection: "row", gap: 10, alignItems: "center" }, avatar: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 16 }, name: { color: "#29251f", fontSize: 15, fontWeight: "900" }, score: { color: "#526b51", fontSize: 11, fontWeight: "900" }, body: { marginTop: 6, color: "#514b43", fontSize: 12, lineHeight: 18, fontWeight: "600" }, meta: { marginTop: 11, color: "#746b5f", fontSize: 10, fontWeight: "900" }, button: { marginTop: 12, paddingHorizontal: 14, paddingVertical: 9, alignItems: "center", backgroundColor: "#b9dcf2", borderColor: "#29251f", borderWidth: 1.3, borderRadius: 13 }, secondary: { backgroundColor: "#fff" }, buttonText: { color: "#29251f", fontSize: 12, fontWeight: "900" }, row: { flexDirection: "row", gap: 8 }, link: { color: "#31583c", fontSize: 12, fontWeight: "900", textDecorationLine: "underline" }, buddy: { marginBottom: 7, padding: 11, backgroundColor: "#d5eccd", borderRadius: 14 }, relation: { marginTop: 12, color: "#31583c", fontSize: 12, fontWeight: "900" } });
