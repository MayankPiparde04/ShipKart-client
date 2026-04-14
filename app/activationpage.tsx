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

const otpSlots = ["otp-0", "otp-1", "otp-2", "otp-3", "otp-4", "otp-5"] as const;
const OTP_VALIDITY_SECONDS = 5 * 60;

export default function ActivationPage() {
  const router = useRouter();
  useColorScheme();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState(OTP_VALIDITY_SECONDS);

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
        setTimeLeft(OTP_VALIDITY_SECONDS);
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

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [email, router]);

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      className="flex-1 bg-navy-950"
    >
      <StatusBar
        style="light"
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
              <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-azure-500/15">
                <Ionicons
                  name="shield-checkmark"
                  size={40}
                  color="#007FFF"
                />
              </View>
              <Text className="mb-3 text-center text-3xl font-extrabold tracking-tight text-azure-50">
                Enter Verification Code
              </Text>
              <Text className="mb-1 text-center text-base font-medium text-azure-200">
                We&apos;ve sent a 6-digit code to:
              </Text>
              <Text className="mb-6 text-center text-lg font-bold text-azure-500">
                {email}
              </Text>
            </View>

            {/* OTP Input Section */}
            <View className="w-full mb-8">
              <View className="flex-row justify-between w-full mb-4">
                {otpSlots.map((slot, index) => (
                  <TextInput
                    key={slot}
                    ref={(ref) => {
                      inputRefs.current[index] = ref;
                    }}
                    className={`w-12 h-14 rounded-xl border-2 text-center text-2xl font-bold
                      ${
                        error
                          ? "border-red-500 text-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-navy-800/30 bg-navy-900 text-azure-50"
                      }
                      focus:border-azure-500 focus:bg-navy-950`}
                    maxLength={1}
                    keyboardType="number-pad"
                    value={otp[index] || ""}
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
                  <Text className="font-bold text-azure-500">
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
                className={`h-14 w-full items-center justify-center rounded-2xl ${
                  otp.join("").length === 6
                    ? "bg-azure-500"
                    : "bg-navy-900"
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
                className="h-14 w-full items-center justify-center rounded-2xl bg-transparent"
                onPress={resendActivationEmail}
              >
                <Text className="text-lg font-bold tracking-wide text-azure-500">
                  Resend Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="-mt-2 h-14 w-full items-center justify-center rounded-2xl bg-transparent"
                onPress={() => router.replace("/login")}
              >
                <Text className="text-base font-bold tracking-wide text-azure-200">
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
