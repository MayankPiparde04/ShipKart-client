//Login page

import { useAuth } from "@/contexts/AuthContext";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useMemo, useState } from "react";
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

const Login = React.memo(() => {
  const { login } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { fetchItems } = useInventory();
  const { fetchBoxes } = useBoxes();

  const HeaderComponent = useMemo(
    () => (
      <View className="mb-10 items-center pt-10">
        <View className="w-24 h-24 bg-primary-600 dark:bg-primary-500 rounded-[28px] items-center justify-center mb-6 shadow-xl shadow-primary-600/30 rotate-3">
          <FontAwesome5 name="shipping-fast" size={36} color="white" />
        </View>
        <Text className="text-4xl font-extrabold text-gray-900 dark:text-white mb-3 text-center tracking-tight">
          Welcome Back
        </Text>
        <Text className="text-lg text-gray-500 dark:text-gray-400 text-center font-medium">
          Sign in to your ShipWise account
        </Text>
      </View>
    ),
    [],
  );

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      await fetchItems();
      await fetchBoxes();
    } catch (error: any) {
      if (
        error.message?.includes("not activated") ||
        error.message?.includes("verify your email")
      ) {
        Alert.alert(
          "Account Not Activated",
          "Please verify your email address first.",
          [
            {
              text: "Go to Activation",
              onPress: () =>
                router.push({
                  pathname: "/activationpage",
                  params: { email: email.trim() },
                }),
            },
            { text: "Cancel", style: "cancel" },
          ],
        );
      } else {
        Alert.alert("Login Failed", error.message || "An error occurred");
      }
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
            {HeaderComponent}

            {/* Input Form Section */}
            <View className="space-y-6">
              <View className="space-y-2">
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
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    placeholderTextColor={isDark ? "#94a3b8" : "#94a3b8"}
                  />
                </View>
              </View>

              <View className="space-y-2">
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
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
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

              {/* Action Button */}
              <TouchableOpacity
                className={`w-full h-14 mt-6 rounded-2xl items-center justify-center flex-row ${
                  isLoading
                    ? "bg-primary-400 dark:bg-primary-800"
                    : "bg-primary-600 dark:bg-primary-500 active:bg-primary-700"
                } shadow-lg shadow-primary-500/30`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white text-lg font-bold ml-3 tracking-wide">
                      Signing In...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white text-lg font-bold tracking-wide">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="w-full max-w-lg self-center mt-6">
              <TouchableOpacity className="mb-6 items-center">
                <Text className="text-primary-600 dark:text-primary-400 font-semibold text-base">
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center border-t border-gray-200 dark:border-gray-800 pt-6 justify-center">
                <Text className="text-gray-500 dark:text-gray-400 text-base">
                  Don&apos;t have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/register")}
                  hitSlop={10}
                >
                  <Text className="text-primary-600 dark:text-primary-400 text-base font-bold">
                    Sign Up
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

Login.displayName = "LoginScreen";
export default Login;
