import { useAuth } from "@/contexts/AuthContext";
import { useColorScheme } from "@/hooks/useColorScheme";
import { apiService } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout, updateUserContext } = useAuth();
  const { height } = useWindowDimensions();

  // Theme integration
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    address: user?.address || "",
  });

  // Update editedUser when user data changes
  useEffect(() => {
    if (user) {
      setEditedUser({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        company: user.company || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Call API to update user data
      const response = await apiService.updateUserProfile({
        name: editedUser.name,
        phone: editedUser.phone,
        company: editedUser.company,
        address: editedUser.address,
      });

      if (response.success) {
        // Only update context with the new user data, do not pass the whole user object
        await updateUserContext({
          name: editedUser.name,
          phone: editedUser.phone,
          company: editedUser.company,
          address: editedUser.address,
        });

        setIsEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", response.message || "Failed to update profile");
      }
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Something went wrong. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Utility to mask email and phone for privacy
  const maskEmail = (email: string | undefined) => {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (!name || !domain) return "****";
    return name[0] + "****@" + domain;
  };

  const maskPhone = (phone: string | undefined) => {
    if (!phone) return "";
    if (phone.length <= 4) return "****";
    return phone.slice(0, 2) + "****" + phone.slice(-2);
  };

  // Render profile fields - either as text or input
  const renderField = (
    icon: string,
    label: string,
    value: string | undefined,
    key: string,
  ) => {
    let displayValue = value;
    if (!isEditing) {
      if (key === "email") displayValue = maskEmail(value);
      if (key === "phone") displayValue = maskPhone(value);
    }
    return (
      <View className="mb-4">
        <Text className="text-gray-500 dark:text-gray-400 text-xs mb-1 flex-row items-center">
          <Ionicons
            name={icon as any}
            size={14}
            color={isDark ? "#9CA3AF" : "#6B7280"}
          />{" "}
          {label}
        </Text>

        {isEditing && key !== "email" ? (
          <TextInput
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-3 rounded-lg border-gray-200 dark:border-gray-700 border"
            value={editedUser[key as keyof typeof editedUser]}
            onChangeText={(text) =>
              setEditedUser({ ...editedUser, [key]: text })
            }
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          />
        ) : (
          <Text className="text-gray-700 dark:text-gray-300 ml-5">
            {displayValue || `No ${label.toLowerCase()} provided`}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100/70 dark:bg-gray-950">
      <StatusBar style="light" translucent={true} />
      <ScrollView className="flex-1">
        {/* Header with avatar */}
        <View
          style={{ height: height * 0.25 }}
          className="bg-gray-100/70 dark:bg-gray-950 px-6 pt-6 pb-12 items-center justify-center"
        >
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 items-center justify-center border border-primary-700">
              <Text className="text-3xl font-semibold text-primary-600 dark:text-primary-400">
                {getInitials(user?.name)}
              </Text>
            </View>
            <Text className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-3">
              {user?.name || "User"}
            </Text>

            {!isEditing && (
              <TouchableOpacity
                className="mt-2 bg-primary-600 dark:bg-primary-500 px-4 py-2 rounded-full flex-row items-center"
                onPress={() => setIsEditing(true)}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text className="ml-1 text-white font-medium">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="px-6 pt-6 pb-10">
          {/* Profile Information Card */}
          <View className="bg-white/40 dark:bg-gray-900 rounded-xl p-5 mb-6 border-gray-400/40 dark:border-gray-400/40 border">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                {/* <View className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center">
                  <Ionicons name="person" size={18} color="#ffffff" />
                </View> */}
                <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 ml-2">
                  Personal Information
                </Text>
              </View>

              {isEditing && (
                <View className="flex-row space-x-2 gap-2">
                  <TouchableOpacity
                    className="bg-white dark:bg-gray-800 p-2 rounded-lg border-gray-200 dark:border-gray-700 border"
                    onPress={() => setIsEditing(false)}
                  >
                    <Ionicons
                      name="close"
                      size={18}
                      color={isDark ? "#9CA3AF" : "#6B7280"}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-primary-600 dark:bg-primary-500 p-2 rounded-lg"
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark" size={18} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {renderField("person-outline", "Full Name", user?.name, "name")}
            {renderField("mail-outline", "Email", user?.email, "email")}
            {renderField("call-outline", "Phone", user?.phone, "phone")}
            {renderField(
              "business-outline",
              "Company",
              user?.company,
              "company",
            )}
            {renderField(
              "location-outline",
              "Address",
              user?.address,
              "address",
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="bg-red-600 p-4 rounded-lg mb-6 border border-red-500"
            onPress={logout}
          >
            <View className="flex-row justify-center items-center">
              <Ionicons name="log-out-outline" size={20} color="#fff" />
              <Text className="text-white text-center font-semibold ml-2">
                Logout
              </Text>
            </View>
          </TouchableOpacity>

          <Text className="text-gray-500 dark:text-gray-400 text-xs text-center">
            ShipWise App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
