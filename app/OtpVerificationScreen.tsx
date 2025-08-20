import React, { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/context/AuthContex"; // make sure the file name is correct

export default function OtpVerificationScreen() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30); // seconds
  const { verify, resendOtp } = useAuth(); // make sure your context exposes resendOtp

  // Read params from the URL: /auth/otp?phone=+254712345678
  const params = useLocalSearchParams<{ phone?: string | string[] }>();
  const phone = useMemo(() => {
    const raw = params.phone;
    return Array.isArray(raw) ? raw[0] : raw; // normalize string | string[] ➜ string
  }, [params.phone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerifyOtp = async () => {
    if (!phone) {
      Alert.alert("Missing phone", "We couldn't find the phone number to verify.");
      return;
    }
    if (otp.length !== 6) {
      Alert.alert("Invalid code", "Enter the 6-digit code.");
      return;
    }

    try {
      setLoading(true);
      await verify({ phoneNumber, otp }); // your context should POST to /auth/verify-otp
      router.replace("/Home/home"); // prevents going back to OTP
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Verification failed";
      Alert.alert("Verification failed", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!phone || cooldown > 0) return;
    try {
      await resendOtp({ phone }); // your context should POST to /auth/request-otp
      setCooldown(30);
      Alert.alert("OTP sent", `We sent a new code to ${phone}`);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Could not resend OTP";
      Alert.alert("Resend failed", msg);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Enter OTP</Text>
      <Text style={styles.subtitle}>
        We’ve sent a 6-digit verification code to {phone ? maskPhone(phone) : "your phone"}.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter 6-digit OTP"
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode" // iOS autofill
        maxLength={6}
        value={otp}
        onChangeText={setOtp}
      />

      <TouchableOpacity style={[styles.button, loading && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify"}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={cooldown > 0}>
        <Text style={styles.resend}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

// small helper to mask a phone number
function maskPhone(p: string) {
  if (p.length < 6) return p;
  return `${p.slice(0, 3)}****${p.slice(-2)}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 10, color: "#111" },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 30, textAlign: "center" },
  input: {
    width: "80%", height: 55, borderWidth: 1, borderColor: "#ccc", borderRadius: 10,
    paddingHorizontal: 15, fontSize: 18, letterSpacing: 4, textAlign: "center", marginBottom: 25,
  },
  button: { width: "80%", backgroundColor: "#4F46E5", paddingVertical: 15, borderRadius: 12, alignItems: "center", marginBottom: 15 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resend: { color: "#4F46E5", fontSize: 14, marginTop: 10 },
});
