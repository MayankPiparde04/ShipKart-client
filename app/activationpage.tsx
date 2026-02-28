//ActivationPage page

import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

export default function ActivationPage() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    setError("");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api"}/activation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, otp: otpString }),
        },
      );

      const data = await response.json();

      if (data.success) {
        if (timerRef.current) clearInterval(timerRef.current);
        Alert.alert(
          "Email Verified! 🎉",
          "Your account has been successfully activated. You can now sign in.",
          [
            {
              text: "Continue to Login",
              onPress: () => router.replace("/login"),
            },
          ],
        );
      } else {
        setError(data.message || "Invalid or expired OTP");
      }
    } catch {
      setError("An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const resendActivationEmail = async () => {
    if (!email) return;

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api"}/resend-activation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          "OTP Sent",
          "A new 6-digit OTP has been sent to your inbox.",
        );
        setTimeLeft(30 * 60); // Reset timer
        setOtp(["", "", "", "", "", ""]); // clear OTP inputs
        setError("");
        inputRefs.current[0]?.focus(); // focus first box
      } else {
        Alert.alert("Error", data.message || "Failed to resend activation OTP");
      }
    } catch {
      Alert.alert("Error", "Failed to resend activation OTP");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!email) {
      router.replace("/login");
      return;
    }

    // Set up countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [email, router]);

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-white dark:bg-[#0f172a]"
    >
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor="transparent"
        translucent={true}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="w-full max-w-lg self-center flex-1 justify-center">
            {/* Header Section */}
            <View className="items-center mb-8 pt-6">
              <View className="w-24 h-24 bg-primary-100 dark:bg-primary-900/50 rounded-full items-center justify-center mb-6">
                <Ionicons
                  name="shield-checkmark"
                  size={40}
                  color={isDark ? "#8b5cf6" : "#7c3aed"}
                />
              </View>
              <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 text-center tracking-tight">
                Enter Verification Code
              </Text>
              <Text className="text-base text-gray-500 dark:text-gray-400 text-center mb-1 font-medium">
                We&apos;ve sent a 6-digit code to:
              </Text>
              <Text className="text-lg font-bold text-primary-600 dark:text-primary-400 text-center mb-6">
                {email}
              </Text>
            </View>

            {/* OTP Input Section */}
            <View className="w-full mb-8">
              <View className="flex-row justify-between w-full mb-4">
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    className={`w-12 h-14 rounded-xl border-2 text-center text-2xl font-bold
                      ${
                        error
                          ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                      }
                      focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                  />
                ))}
              </View>

              {error ? (
                <Text className="text-red-500 font-medium text-center mb-2">
                  {error}
                </Text>
              ) : null}

              {timeLeft > 0 ? (
                <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 font-medium">
                  Code expires in:{" "}
                  <Text className="font-bold text-primary-500">
                    {formatTime(timeLeft)}
                  </Text>
                </Text>
              ) : (
                <Text className="text-sm text-red-500 text-center mt-2 font-bold">
                  Code has expired
                </Text>
              )}
            </View>

            {/* Action Buttons */}
            <View className="w-full space-y-4">
              <TouchableOpacity
                className={`w-full h-14 rounded-2xl items-center justify-center shadow-lg active:bg-primary-700 ${
                  otp.join("").length === 6
                    ? "bg-primary-600 dark:bg-primary-500 shadow-primary-500/30"
                    : "bg-gray-400 dark:bg-gray-600 shadow-transparent"
                }`}
                onPress={verifyOtp}
                disabled={otp.join("").length !== 6 || isVerifying}
              >
                {isVerifying ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-lg font-bold tracking-wide">
                    Verify Account
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-14 bg-transparent rounded-2xl items-center justify-center active:bg-gray-100 dark:active:bg-gray-800"
                onPress={resendActivationEmail}
              >
                <Text className="text-primary-600 dark:text-primary-400 text-lg font-bold tracking-wide">
                  Resend Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full h-14 bg-transparent rounded-2xl items-center justify-center -mt-2 active:bg-gray-100 dark:active:bg-gray-800"
                onPress={() => router.replace("/login")}
              >
                <Text className="text-gray-500 dark:text-gray-400 text-base font-bold tracking-wide">
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
