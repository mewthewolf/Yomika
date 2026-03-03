import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { HAS_SUPABASE_ENV } from "./src/config/env";
import { supabase } from "./src/lib/supabase";

export default function App() {
  const [dbStatus, setDbStatus] = useState("Checking Supabase configuration...");

  useEffect(() => {
    if (!HAS_SUPABASE_ENV || !supabase) {
      setDbStatus("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }

    const client = supabase;
    let isMounted = true;

    const checkConnection = async () => {
      const { error } = await client.from("jlpt_levels").select("code").limit(1);

      if (!isMounted) {
        return;
      }

      if (error) {
        setDbStatus(`Supabase reachable, query failed: ${error.message}`);
        return;
      }

      setDbStatus("Supabase connected and schema query succeeded");
    };

    checkConnection();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>Yomika MVP Bootstrap</Text>
        <Text style={styles.subtitle}>JLPT + Joyo Kanji learning platform</Text>
        <Text style={styles.statusLabel}>Backend status</Text>
        <Text style={styles.statusValue}>{dbStatus}</Text>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f3f7fb",
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#d5e0ee",
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#13213a",
  },
  subtitle: {
    fontSize: 14,
    color: "#40516d",
  },
  statusLabel: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: "#4a648b",
  },
  statusValue: {
    fontSize: 14,
    color: "#1a2c4a",
  },
});
