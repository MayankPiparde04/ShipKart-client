import { apiService } from "@/services/api";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const strongPasswordPattern = /^(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPasswordScreen() {
  const { showSnackbar } = useSnackbar();
  const params = useLocalSearchParams<{ email?: string; otp?: string }>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const email = useMemo(
    () => (typeof params.email === "string" ? params.email : ""),
    [params.email],
  );

  const otp = useMemo(
    () => (typeof params.otp === "string" ? params.otp : ""),
    [params.otp],
  );

  const handleResetPassword = async () => {
    if (isLoading) {
      return;
    }

    if (!email || !otp) {
      showSnackbar("Session expired. Please verify OTP again.", "error");
      router.replace("/forgot-password");
      return;
    }

    if (!newPassword || !confirmPassword) {
      showSnackbar("Enter and confirm your new password.", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showSnackbar("Passwords do not match.", "error");
      return;
    }

    if (newPassword.length < 8) {
      showSnackbar("Password must be at least 8 characters.", "error");
      return;
    }

    if (!strongPasswordPattern.test(newPassword)) {
      showSnackbar("Password must include at least one special character.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.resetPassword({
        email,
        otp,
        newPassword,
      });

      if (!response.success) {
        throw new Error(response.message || "Failed to reset password");
      }

      showSnackbar("Password reset successfully! Please login.", "success", 2000);
      setTimeout(() => {
        router.replace("/login");
      }, 2000);
    } catch (error: any) {
      showSnackbar(error.message || "Unable to reset password", "error");
    } finally {
      setIsLoading(false);
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
                <Ionicons name="key-outline" size={34} color="#fff" />
              </View>
              <Text className="text-center text-3xl font-extrabold text-azure-50">
                Reset Password
              </Text>
              <Text className="mt-2 text-center text-base text-azure-200">
                {email ? `Resetting password for ${email}` : "Create a new password for your account."}
              </Text>
            </View>

            <View className="rounded-card border border-navy-800/30 bg-navy-900 p-5">
              <Text className="mb-2 text-sm font-semibold text-azure-200">New Password</Text>
              <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-950">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Minimum 8 chars + 1 special char"
                  placeholderTextColor="#99CCFF"
                  className="h-14 px-4 text-base text-azure-50"
                  editable={!isLoading}
                />
              </View>

              <Text className="mb-2 text-sm font-semibold text-azure-200">Confirm Password</Text>
              <View className="mb-4 rounded-card border border-navy-800/30 bg-navy-950">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholder="Re-enter new password"
                  placeholderTextColor="#99CCFF"
                  className="h-14 px-4 text-base text-azure-50"
                  editable={!isLoading}
                />
              </View>

              <TouchableOpacity
                className={`h-14 flex-row items-center justify-center rounded-2xl border border-azure-400/40 ${isLoading ? "bg-azure-600" : "bg-azure-500"}`}
                onPress={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} /> : null}
                <Text className="text-base font-bold text-white">
                  {isLoading ? "Saving..." : "Reset Password"}
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
