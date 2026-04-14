import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
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

const LIGHT_FOREGROUND = "#EAF4FF";

export default function ProfileScreen() {
  const { user, logout, updateUserContext } = useAuth();
  const { height } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();

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
        <Text className="mb-1 flex-row items-center text-xs text-azure-200">
          <Ionicons name={icon as any} size={14} color="#99CCFF" />{" "}
          {label}
        </Text>

        {isEditing && key !== "email" ? (
          <TextInput
            className="rounded-card border border-navy-800/30 bg-navy-900 p-3 text-azure-50"
            value={editedUser[key as keyof typeof editedUser]}
            onChangeText={(text) =>
              setEditedUser({ ...editedUser, [key]: text })
            }
            placeholder={`Enter ${label.toLowerCase()}`}
            placeholderTextColor="#99CCFF"
            selectionColor="#3399FF"
          />
        ) : (
          <Text className="ml-5 text-azure-50">
            {displayValue || `No ${label.toLowerCase()} provided`}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" translucent={true} />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: tabBarHeight + 20 }}
      >
        {/* Header with avatar */}
        <View
          style={{ height: height * 0.25 }}
          className="items-center justify-center bg-navy-950 px-6 pb-12 pt-6"
        >
          <View className="items-center">
            <View className="h-24 w-24 items-center justify-center rounded-full border border-navy-800/40 bg-navy-900">
              <Text className="text-3xl font-semibold text-azure-500">
                {getInitials(user?.name)}
              </Text>
            </View>
            <Text className="mt-3 text-xl font-bold text-azure-50">
              {user?.name || "User"}
            </Text>

            {!isEditing && (
              <TouchableOpacity
                className="mt-2 flex-row items-center rounded-full border border-azure-400/40 bg-azure-500 px-4 py-2"
                onPress={() => setIsEditing(true)}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={LIGHT_FOREGROUND}
                />
                <Text className="ml-1 text-white font-medium">
                  Edit Profile
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="px-6 pt-6 pb-10">
          {/* Profile Information Card */}
          <View className="mb-6 rounded-card border border-navy-800/30 bg-navy-900 p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Text className="ml-2 text-lg font-semibold text-azure-50">
                  Personal Information
                </Text>
              </View>

              {isEditing && (
                <View className="flex-row space-x-2 gap-2">
                  <TouchableOpacity
                    className="rounded-lg border border-navy-800/30 bg-navy-950 p-2"
                    onPress={() => setIsEditing(false)}
                  >
                    <Ionicons name="close" size={18} color="#99CCFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="rounded-lg border border-azure-400/40 bg-azure-500 p-2"
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator
                        size="small"
                        color={LIGHT_FOREGROUND}
                      />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={LIGHT_FOREGROUND}
                      />
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
            className="mb-6 rounded-card border border-navy-800/30 bg-navy-900 p-4"
            onPress={logout}
          >
            <View className="flex-row justify-center items-center">
              <Ionicons name="log-out-outline" size={20} color="#99CCFF" />
              <Text className="ml-2 text-center font-semibold text-azure-50">
                Logout
              </Text>
            </View>
          </TouchableOpacity>

          <Text className="text-center text-xs text-azure-200">
            ShipWise App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
