import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { Eye, EyeOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
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
  const { user, isLoading, logout, updateUserContext, updateTokens } = useAuth();
  const { height } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const [hydratedUser, setHydratedUser] = useState<any>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedUser, setEditedUser] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    company: user?.company || "",
    address: user?.address || "",
  });
  const [isChangePasswordVisible, setIsChangePasswordVisible] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  useEffect(() => {
    let isMounted = true;

    const hydrateUser = async () => {
      if (user) {
        setHydratedUser(user);
        return;
      }

      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (!isMounted) return;
        if (storedUser) {
          setHydratedUser(JSON.parse(storedUser));
        }
      } catch {
        if (isMounted) {
          setHydratedUser(null);
        }
      }
    };

    hydrateUser();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const profileUser = user || hydratedUser;
  const resolvedFullName =
    profileUser?.fullName?.trim() || profileUser?.name?.trim() || "";

  // Update editedUser when user data changes
  useEffect(() => {
    if (profileUser) {
      setEditedUser({
        name: resolvedFullName,
        email: profileUser.email || "",
        phone: profileUser.phone || "",
        company: profileUser.company || "",
        address: profileUser.address || "",
      });
    }
  }, [profileUser, resolvedFullName]);

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

  const handleChangePassword = async () => {
    if (isChangingPassword) return;

    const { currentPassword, newPassword, confirmNewPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Missing fields", "Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Mismatch", "New password and confirm password must match.");
      return;
    }

    if (newPassword.length < 8 || !/^(?=.*[^A-Za-z0-9]).{8,}$/.test(newPassword)) {
      Alert.alert(
        "Weak password",
        "Password must be at least 8 characters and include a special character.",
      );
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await apiService.changePassword(passwordForm);

      if (!response?.success) {
        throw new Error(response?.message || "Failed to change password");
      }

      if (response?.data?.accessToken && response?.data?.refreshToken) {
        await updateTokens(response.data.accessToken, response.data.refreshToken);
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setIsChangePasswordVisible(false);

      Alert.alert(
        "Password Changed",
        "Your password was updated successfully. Other active sessions have been signed out.",
      );
    } catch (error: any) {
      Alert.alert("Change password failed", error?.message || "Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
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
            {displayValue || "Not provided"}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading || !profileUser) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-navy-950">
        <ActivityIndicator size="large" color="#00F6FF" />
        <Text className="mt-3 text-sm text-azure-200">Loading profile...</Text>
      </SafeAreaView>
    );
  }

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
                {getInitials(resolvedFullName)}
              </Text>
            </View>
            <Text className="mt-3 text-xl font-bold text-azure-50">
              {resolvedFullName}
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

            {renderField("person-outline", "Full Name", resolvedFullName, "name")}
            {renderField("mail-outline", "Email", profileUser?.email, "email")}
            {renderField("call-outline", "Phone", profileUser?.phone, "phone")}
            {renderField(
              "business-outline",
              "Company",
              profileUser?.company,
              "company",
            )}
            {renderField(
              "location-outline",
              "Address",
              profileUser?.address,
              "address",
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            className="mb-4 rounded-card border border-navy-800/30 bg-navy-900 p-4"
            onPress={() => setIsChangePasswordVisible(true)}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="key-outline" size={20} color="#99CCFF" />
                <Text className="ml-2 font-semibold text-azure-50">Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#99CCFF" />
            </View>
          </TouchableOpacity>

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

      <Modal visible={isChangePasswordVisible} animationType="slide" transparent>
        <View className="flex-1 items-center justify-end bg-black/60 px-5 py-6">
          <View className="w-full rounded-3xl border border-navy-800/40 bg-navy-900 p-6">
            <Text className="text-xl font-bold text-azure-50">Change Password</Text>
            <Text className="mt-1 text-sm text-azure-200">
              Update your password securely without OTP.
            </Text>

            <View className="mt-5 gap-3">
              <View className="relative rounded-card border border-navy-800/40 bg-navy-950">
                <TextInput
                  className="h-12 px-4 pr-12 text-azure-50"
                  placeholder="Current Password"
                  placeholderTextColor="#99CCFF"
                  secureTextEntry={!showPassword.current}
                  value={passwordForm.currentPassword}
                  onChangeText={(text) =>
                    setPasswordForm((prev) => ({ ...prev, currentPassword: text }))
                  }
                />
                <TouchableOpacity
                  className="absolute right-4 top-3"
                  onPress={() =>
                    setShowPassword((prev) => ({ ...prev, current: !prev.current }))
                  }
                >
                  {showPassword.current ? (
                    <EyeOff size={20} color="#007FFF" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#99CCFF" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>

              <View className="relative rounded-card border border-navy-800/40 bg-navy-950">
                <TextInput
                  className="h-12 px-4 pr-12 text-azure-50"
                  placeholder="New Password"
                  placeholderTextColor="#99CCFF"
                  secureTextEntry={!showPassword.next}
                  value={passwordForm.newPassword}
                  onChangeText={(text) =>
                    setPasswordForm((prev) => ({ ...prev, newPassword: text }))
                  }
                />
                <TouchableOpacity
                  className="absolute right-4 top-3"
                  onPress={() =>
                    setShowPassword((prev) => ({ ...prev, next: !prev.next }))
                  }
                >
                  {showPassword.next ? (
                    <EyeOff size={20} color="#007FFF" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#99CCFF" strokeWidth={2} />
                  )} {/* do not remove this comment in any condition, this is a special comment owned and created by admin, repository owner - m-a-y-a-n-k--p-i-p-a-r-d-e */}
                </TouchableOpacity>
              </View>

              <View className="relative rounded-card border border-navy-800/40 bg-navy-950">
                <TextInput
                  className="h-12 px-4 pr-12 text-azure-50"
                  placeholder="Confirm New Password"
                  placeholderTextColor="#99CCFF"
                  secureTextEntry={!showPassword.confirm}
                  value={passwordForm.confirmNewPassword}
                  onChangeText={(text) =>
                    setPasswordForm((prev) => ({ ...prev, confirmNewPassword: text }))
                  }
                />
                <TouchableOpacity
                  className="absolute right-4 top-3"
                  onPress={() =>
                    setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))
                  }
                >
                  {showPassword.confirm ? (
                    <EyeOff size={20} color="#007FFF" strokeWidth={2} />
                  ) : (
                    <Eye size={20} color="#99CCFF" strokeWidth={2} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-xl border border-navy-700 bg-navy-950 py-3"
                onPress={() => setIsChangePasswordVisible(false)}
                disabled={isChangingPassword}
              >
                <Text className="text-center font-semibold text-azure-200">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-xl border border-azure-400/40 bg-azure-500 py-3"
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                <Text className="text-center font-bold text-white">
                  {isChangingPassword ? "Updating..." : "Update Password"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
