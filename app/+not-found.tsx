import { Link, Stack } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-navy-950 px-6 pt-6">
        {/* Top-left back arrow */}
        <Link href="/" className="absolute left-6 top-8 z-10" asChild>
          <ArrowLeft size={28} strokeWidth={1.5} color="#99CCFF" />
        </Link>

        {/* Centered content */}
        <View className="flex-1 justify-center items-center">
          <Text className="mb-4 text-3xl font-bold text-azure-50">Oops!</Text>
          <Text className="text-center text-lg text-azure-200">
            This screen does not exist.
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
