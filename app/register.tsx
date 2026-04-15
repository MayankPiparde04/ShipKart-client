//register page

import { useAuth } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff } from "lucide-react-native";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState("");

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
            paddingHorizontal: 24,
            paddingVertical: 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View className="w-full max-w-lg self-center flex-1 justify-center">
            {/* Header Section */}
            <View className="mb-8 items-center pt-6">
              <View className="mb-5 h-20 w-20 items-center justify-center rounded-[24px] border border-azure-400/40 bg-azure-500">
                <Ionicons name="person-add" size={32} color="white" />
              </View>
              <Text className="mb-2 text-center text-3xl font-extrabold tracking-tight text-azure-50">
                Create Account
              </Text>
              <Text className="text-center text-base font-medium text-azure-200">
                Join ShipWise today
              </Text>
            </View>

            {/* Input Form Section */}
            <View className="space-y-4">
              <View className="space-y-1">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Full Name
                </Text>
                <View className={`relative overflow-hidden rounded-card border bg-navy-900 ${focusedField === "name" ? "border-azure-500" : "border-navy-800/30"}`}>
                  <Ionicons
                    name="person-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full pl-12 pr-4 text-base text-azure-50"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChangeText={(value) => updateField("name", value)}
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField("")}
                  />
                </View>
              </View>

              <View className="space-y-1">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Email Address
                </Text>
                <View className={`relative overflow-hidden rounded-card border bg-navy-900 ${focusedField === "email" ? "border-azure-500" : "border-navy-800/30"}`}>
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full pl-12 pr-4 text-base text-azure-50"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChangeText={(value) => updateField("email", value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                  />
                </View>
              </View>

              <View className="space-y-1">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Phone Number
                </Text>
                <View className={`relative overflow-hidden rounded-card border bg-navy-900 ${focusedField === "phone" ? "border-azure-500" : "border-navy-800/30"}`}>
                  <Ionicons
                    name="call-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full pl-12 pr-4 text-base text-azure-50"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChangeText={(value) => updateField("phone", value)}
                    keyboardType="phone-pad"
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField("")}
                  />
                </View>
              </View>

              <View className="space-y-1">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Password
                </Text>
                <View className={`relative overflow-hidden rounded-card border bg-navy-900 ${focusedField === "password" ? "border-azure-500" : "border-navy-800/30"}`}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full pl-12 pr-12 text-base text-azure-50"
                    placeholder="Create a password"
                    value={formData.password}
                    onChangeText={(value) => updateField("password", value)}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-[16px] z-10 p-1"
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#007FFF" strokeWidth={2} />
                    ) : (
                      <Eye size={20} color="#99CCFF" strokeWidth={2} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View className="space-y-1">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Confirm Password
                </Text>
                <View className={`relative overflow-hidden rounded-card border bg-navy-900 ${focusedField === "confirmPassword" ? "border-azure-500" : "border-navy-800/30"}`}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full pl-12 pr-4 text-base text-azure-50"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChangeText={(value) =>
                      updateField("confirmPassword", value)
                    }
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setFocusedField("confirmPassword")}
                    onBlur={() => setFocusedField("")}
                  />
                </View>
              </View>

              <TouchableOpacity
                className={`w-full h-14 mt-8 rounded-2xl items-center justify-center flex-row ${
                  isLoading
                    ? "bg-azure-400/65"
                    : "bg-azure-500 active:bg-azure-400"
                  } border border-azure-400/40`}
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
              <View className="flex-row items-center justify-center border-t border-navy-800/30 pt-6">
                <Text className="text-base text-azure-200">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/login")}
                  hitSlop={10}
                >
                  <Text className="text-base font-bold text-azure-500">
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
