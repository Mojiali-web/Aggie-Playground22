import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabase } from "../../lib/backend";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ code?: string; token_hash?: string; type?: string; access_token?: string; refresh_token?: string; error_description?: string }>();
  const [message, setMessage] = useState("Checking your sign-in link…");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      let error: string | null = null;
      if (params.error_description) error = String(params.error_description);
      else if (params.code) error = (await supabase.auth.exchangeCodeForSession(String(params.code))).error?.message ?? null;
      else if (params.token_hash) {
        const type = String(params.type ?? "email") as EmailOtpType;
        error = (await supabase.auth.verifyOtp({ token_hash: String(params.token_hash), type })).error?.message ?? null;
      } else if (params.access_token && params.refresh_token) {
        error = (await supabase.auth.setSession({ access_token: String(params.access_token), refresh_token: String(params.refresh_token) })).error?.message ?? null;
      } else error = "This sign-in link is missing its code. Request a new one from Profile.";
      if (!active) return;
      setMessage(error ?? "You’re signed in! Return to the app to continue.");
      setDone(true);
      if (!error) setTimeout(() => router.replace("/"), 1200);
    })();
    return () => { active = false; };
  }, [params.access_token, params.code, params.error_description, params.refresh_token, params.token_hash, params.type]);
  return <View style={styles.screen}><Text style={styles.emoji}>{done ? "🐮" : "✉️"}</Text><Text style={styles.title}>{done ? "Sign-in link checked" : "Signing you in"}</Text><Text style={styles.message}>{message}</Text><Pressable onPress={() => router.replace("/")} style={styles.button}><Text style={styles.buttonText}>Back to Aggie Playground</Text></Pressable></View>;
}
const styles = StyleSheet.create({ screen: { flex: 1, padding: 28, justifyContent: "center", alignItems: "center", backgroundColor: "#e7efe4" }, emoji: { fontSize: 46 }, title: { marginTop: 12, color: "#29251f", fontSize: 24, fontWeight: "900", textAlign: "center" }, message: { marginTop: 8, color: "#655e54", fontSize: 15, lineHeight: 22, fontWeight: "600", textAlign: "center" }, button: { marginTop: 22, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 15, borderWidth: 1.5, borderColor: "#29251f", backgroundColor: "#ffdc62" }, buttonText: { color: "#29251f", fontWeight: "900" } });
