//Login page

import { useAuth } from "@/contexts/AuthContext";
import { useBoxes } from "@/contexts/BoxContext";
import { useInventory } from "@/contexts/InventoryContext";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const { fetchItems } = useInventory();
  const { fetchBoxes } = useBoxes();

  const HeaderComponent = useMemo(
    () => (
      <View className="mb-8 items-center pt-8">
        <View className="mb-6 h-24 w-24 rotate-3 items-center justify-center rounded-[28px] border border-azure-400/40 bg-azure-500">
          <FontAwesome5 name="shipping-fast" size={36} color="white" />
        </View>
        <Text className="mb-3 text-center text-4xl font-extrabold tracking-tight text-azure-50">
          Welcome Back
        </Text>
        <Text className="text-center text-lg font-medium text-azure-200">
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
            {HeaderComponent}

            {/* Input Form Section */}
            <View className="space-y-6">
              <View className="space-y-2">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Email Address
                </Text>
                <View
                  className={`relative overflow-hidden rounded-card border bg-navy-900 ${isEmailFocused ? "border-azure-500" : "border-navy-800/30"}`}
                >
                  <Ionicons
                    name="mail-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full border border-transparent pl-12 pr-4 text-base text-azure-50"
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                </View>
              </View>

              <View className="space-y-2">
                <Text className="ml-1 text-sm font-semibold text-azure-200">
                  Password
                </Text>
                <View
                  className={`relative overflow-hidden rounded-card border bg-navy-900 ${isPasswordFocused ? "border-azure-500" : "border-navy-800/30"}`}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color="#99CCFF"
                    className="absolute left-4 top-[18px] z-10"
                  />
                  <TextInput
                    className="h-14 w-full border border-transparent pl-12 pr-12 text-base text-azure-50"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    placeholderTextColor="#99CCFF"
                    selectionColor="#3399FF"
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    className="absolute right-4 top-[16px] z-10 p-1"
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#99CCFF"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                className={`w-full h-14 mt-6 rounded-2xl items-center justify-center flex-row ${
                  isLoading
                    ? "bg-azure-400/65"
                    : "bg-azure-500 active:bg-azure-400"
                  } border border-azure-400/40`}
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
                <Text className="text-base font-semibold text-azure-500">
                  Forgot your password?
                </Text>
              </TouchableOpacity>

              <View className="flex-row items-center justify-center border-t border-navy-800/30 pt-6">
                <Text className="text-base text-azure-200">
                  Don&apos;t have an account?{" "}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push("/register")}
                  hitSlop={10}
                >
                  <Text className="text-base font-bold text-azure-500">
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
