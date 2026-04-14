import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ShippingScreen() {
  return (
    <SafeAreaView className="flex-1 bg-navy-950">
      <View className="flex-1 p-6">
        <Text className="mb-4 text-2xl font-bold text-azure-50">
          Shipping Calculator
        </Text>
        <Text className="text-azure-200/80">
          Calculate optimal shipping solutions
        </Text>
      </View>
    </SafeAreaView>
  );
}
