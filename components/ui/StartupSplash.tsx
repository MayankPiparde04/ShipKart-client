import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

interface StartupSplashProps {
  statusText?: string;
  showAction?: boolean;
  actionLabel?: string;
  onActionPress?: () => void;
}

const VERSION_LABEL = "v1.0.0";

export default function StartupSplash({
  statusText = "Preparing secure workspace",
  showAction = false,
  actionLabel = "Get Started",
  onActionPress,
}: Readonly<StartupSplashProps>) {
  const [heroIconFailed, setHeroIconFailed] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <StatusBar style="light" backgroundColor="#001224" translucent={false} />

      <View className="flex-1 justify-between px-6 pb-6 pt-10">
        <View className="flex-1 items-center justify-center">
          <View className="items-center">
            <View className="items-center justify-center rounded-[36px] border border-navy-800/30 bg-navy-900 p-4">
              {heroIconFailed ? (
                <View className="h-[240px] w-[240px] items-center justify-center">
                  <FontAwesome5 name="shipping-fast" size={72} color="#007FFF" />
                </View>
              ) : (
                <Image
                  source={require("../../assets/images/Shipwise_logo_t.png")}
                  style={{ width: 240, height: 240 }}
                  contentFit="contain"
                  transition={0}
                  onError={() => setHeroIconFailed(true)}
                />
              )}
            </View>

            <Text className="mt-8 text-center text-5xl font-extrabold tracking-[4px] text-azure-50">
              SHIPWISE
            </Text>
            <Text className="mt-3 text-center text-lg font-medium text-azure-200">
              Max Volume, Min Waste
            </Text>
          </View>
        </View>

        <View className="items-center gap-y-4">
          <View className="w-full max-w-md rounded-card border border-navy-800/30 bg-navy-900 px-4 py-4">
            <View className="flex-row items-center">
              <FontAwesome5 name="circle-notch" size={16} color="#99CCFF" />
              <Text className="ml-3 text-sm font-medium text-azure-200">
                {statusText}
              </Text>
            </View>
            <View className="mt-3 h-1 overflow-hidden rounded-full bg-navy-800/50">
              <View className="h-full w-1/3 rounded-full bg-azure-500" />
            </View>
          </View>

          {showAction ? (
            <TouchableOpacity
              className="mt-1 w-full max-w-md items-center justify-center rounded-[24px] border border-azure-400/40 bg-azure-500 py-4 active:bg-azure-400"
              onPress={onActionPress}
            >
              <Text className="text-lg font-bold tracking-wide text-white">
                {actionLabel}
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text className="text-xs font-semibold uppercase tracking-[3px] text-[#007FFF]">
            {VERSION_LABEL}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
