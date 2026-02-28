import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ItemsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
      <View className="flex-1 p-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Items Management
        </Text>
        <Text className="text-gray-600 dark:text-gray-300">
          Manage your inventory items here
        </Text>
      </View>
    </SafeAreaView>
  );
}
