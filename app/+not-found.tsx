import { Link, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 bg-white dark:bg-gray-900 px-6 pt-12">
        {/* Top-left back arrow */}
        <Link href="/" className="absolute top-12 left-6 z-10" asChild>
          <ArrowLeft size={28} color="#6b7280" />
        </Link>

        {/* Centered content */}
        <View className="flex-1 justify-center items-center">
          <Text className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Oops!</Text>
          <Text className="text-lg text-gray-600 dark:text-gray-300 text-center">
            This screen does not exist.
          </Text>
        </View>
      </View>
    </>
  );
}
