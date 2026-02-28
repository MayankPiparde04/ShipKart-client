//register page

import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState, useCallback } from "react";
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

const Register = React.memo(() => {
  const { register } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = useCallback((field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleRegister = async () => {
    const { name, email, password, confirmPassword, phone } = formData;

    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, phone.trim());
      Alert.alert(
        "Registration Successful! 🎉",
        "Please check your email for activation instructions",
        [
          {
            text: "Continue",
            onPress: () =>
              router.replace({
                pathname: "/activationpage",
                params: { email: email.trim() },
              }),
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error.message || "An error occurred during registration",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            <View className="mb-8 items-center pt-6">
              <View className="w-20 h-20 bg-primary-600 dark:bg-primary-500 rounded-[24px] items-center justify-center mb-5 shadow-xl shadow-primary-600/30">
                <Ionicons name="person-add" size={32} color="white" />
              </View>
              <Text className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 text-center tracking-tight">
                Create Account
              </Text>
              <Text className="text-base text-gray-500 dark:text-gray-400 text-center font-medium">
                Join ShipWise today
              </Text>
            </View>

            {/* Input Form Section */}
            <View className="space-y-4">
              <View className="space-y-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Full Name
                </Text>
                <View className="relative bg-gray-50 dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-indigo-500 overflow-hidden">
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="w-full h-14 pl-12 pr-4 text-base text-gray-900 dark:text-white"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChangeText={(value) => updateField("name", value)}
                    editable={!isLoading}
                    placeholderTextColor={isDark ? "#94a3b8" : "#94a3b8"}
                  />
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Email Address
                </Text>
                <View className="relative bg-gray-50 dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-indigo-500 overflow-hidden">
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="w-full h-14 pl-12 pr-4 text-base text-gray-900 dark:text-white"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChangeText={(value) => updateField("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    placeholderTextColor={isDark ? "#94a3b8" : "#94a3b8"}
                  />
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Phone Number
                </Text>
                <View className="relative bg-gray-50 dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-indigo-500 overflow-hidden">
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="w-full h-14 pl-12 pr-4 text-base text-gray-900 dark:text-white"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    placeholderTextColor={isDark ? "#94a3b8" : "#94a3b8"}
                  />
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Password
                </Text>
                <View className="relative bg-gray-50 dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-indigo-500 overflow-hidden">
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="w-full h-14 pl-12 pr-12 text-base text-gray-900 dark:text-white"
                    placeholder="Create a password"
                    value={formData.password}
                    onChangeText={(value) => updateField("password", value)}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    placeholderTextColor={isDark ? "#94a3b8" : "#94a3b8"}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-[16px] z-10 p-1"
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color={isDark ? "#94a3b8" : "#64748b"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View className="space-y-1">
                <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Confirm Password
                </Text>
                <View className="relative bg-gray-50 dark:bg-[#1e293b] rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-indigo-500 overflow-hidden">
                  <Ionicons
                    name="checkmark-done-outline"
                    size={22}
                    color={isDark ? "#94a3b8" : "#64748b"}
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="w-full h-14 pl-12 pr-4 text-base text-gray-900 dark:text-white"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      updateField("confirmPassword", value)
                    }
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    placeholderTextColor={isDark ? "#94a3b8" : "#94a3b8"}
                  />
                </View>
              </View>

              <TouchableOpacity
                className={`w-full h-14 mt-8 rounded-2xl items-center justify-center flex-row ${
                  isLoading
                    ? "bg-primary-400 dark:bg-primary-800"
                    : "bg-primary-600 dark:bg-primary-500 active:bg-primary-700"
                } shadow-lg shadow-primary-500/30`}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white text-lg font-bold ml-3 tracking-wide">
                      Creating Account...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white text-lg font-bold tracking-wide">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="w-full max-w-lg self-center mt-6">
              <View className="flex-row items-center border-t border-gray-200 dark:border-gray-800 pt-6 justify-center">
                <Text className="text-gray-500 dark:text-gray-400 text-base">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  hitSlop={10}
                >
                  <Text className="text-primary-600 dark:text-primary-400 text-base font-bold">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
});

Register.displayName = "Register";
export default Register;
