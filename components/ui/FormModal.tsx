import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface FormModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function FormModal({
  visible,
  onClose,
  title,
  children,
}: Readonly<FormModalProps>) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      presentationStyle="overFullScreen"
      hardwareAccelerated
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-[#001224]/70">
        <View className="h-[85%] rounded-t-card border border-navy-800/30 bg-navy-900">
          <SafeAreaView className="flex-1">
            <View className="flex-row items-center justify-between border-b border-navy-800/30 px-6 py-4">
              <Text className="text-2xl font-bold text-azure-50">
                {title}
              </Text>
              <TouchableOpacity onPress={onClose} className="p-2">
                <Ionicons name="close" size={24} color="#99CCFF" />
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              className="flex-1"
            >
              <ScrollView
                className="flex-1 px-6 pt-4"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {children}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}
