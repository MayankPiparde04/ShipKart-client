import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const OTP_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "verify">("request");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(() => {
      setCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldown]);

  const canResend = cooldown === 0 && !loading;
  const buttonLabel = useMemo(
    () => (step === "request" ? "Send OTP" : "Verify OTP"),
    [step],
  );

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      Alert.alert("Email required", "Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.requestForgotPasswordOtp(trimmedEmail);
      if (!response.success) {
        throw new Error(response.message || "Failed to send OTP");
      }

      setStep("verify");
      setCooldown(OTP_COOLDOWN_SECONDS);
      Alert.alert(
        "OTP Sent",
        response.message || "A verification code has been sent to your email.",
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedOtp = otp.trim();

    if (!trimmedEmail || !trimmedOtp) {
      Alert.alert("Missing details", "Email and OTP are required.");
      return;
    }

    if (trimmedOtp.length !== 6) {
      Alert.alert("Invalid OTP", "Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.verifyForgotPasswordOtp(trimmedEmail, trimmedOtp);
      if (!response.success) {
        throw new Error(response.message || "OTP verification failed");
      }

      router.push({
        pathname: "/reset-password",
        params: {
          email: trimmedEmail,
          otp: trimmedOtp,
        },
      });
    } catch (error: any) {
      Alert.alert("Verification failed", error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryAction = () => {
    if (step === "request") {
      void handleSendOtp();
    } else {
      void handleVerifyOtp();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center">
            <View className="mb-8 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-[28px] border border-azure-400/40 bg-azure-500">
                <Ionicons name="shield-checkmark-outline" size={34} color="#fff" />
              </View>
              <Text className="text-center text-3xl font-extrabold text-azure-50">
                Forgot Password
              </Text>
              <Text className="mt-2 text-center text-base text-azure-200">
                Enter your email, verify the 6-digit OTP, and reset your password inside the app.
              </Text>
            </View>

            <View className="rounded-card border border-navy-800/30 bg-navy-900 p-5">
              <Text className="mb-2 text-sm font-semibold text-azure-200">Email Address</Text>
              <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-950">
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="name@example.com"
                  placeholderTextColor="#99CCFF"
                  className="h-14 px-4 text-base text-azure-50"
                  editable={!loading}
                />
              </View>

              {step === "verify" ? (
                <>
                  <Text className="mb-2 text-sm font-semibold text-azure-200">OTP Code</Text>
                  <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-950">
                    <TextInput
                      value={otp}
                      onChangeText={(value) => setOtp(value.replaceAll(/\D/g, ""))}
                      keyboardType="number-pad"
                      placeholder="6-digit OTP"
                      placeholderTextColor="#99CCFF"
                      className="h-14 px-4 text-base tracking-[8px] text-azure-50"
                      maxLength={6}
                      editable={!loading}
                    />
                  </View>
                  <Text className="mb-4 text-xs leading-5 text-azure-200">
                    This code is valid for 5 minutes. Do not share it with anyone.
                  </Text>
                  <TouchableOpacity
                    className={`mb-3 h-12 items-center justify-center rounded-2xl border border-azure-400/40 ${canResend ? "bg-navy-950" : "bg-navy-900"}`}
                    disabled={!canResend}
                    onPress={handleSendOtp}
                  >
                    <Text className={`font-semibold ${canResend ? "text-azure-50" : "text-azure-200"}`}>
                      {cooldown > 0 ? `Resend OTP in ${cooldown}s` : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : null}

              <TouchableOpacity
                className="h-14 items-center justify-center rounded-2xl border border-azure-400/40 bg-azure-500"
                onPress={handlePrimaryAction}
                disabled={loading}
              >
                <Text className="text-base font-bold text-white">
                  {loading ? "Please wait..." : buttonLabel}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-4 items-center"
                onPress={() => router.replace("/login")}
              >
                <Text className="text-sm font-semibold text-azure-200">
                  Back to Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
