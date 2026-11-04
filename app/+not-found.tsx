import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 items-center justify-center p-5 bg-white">
        <Text className="text-xl font-bold text-gray-800">This screen does not exist.</Text>
        <Link href="/" className="mt-[15px] py-[15px]">
          <Text className="text-base text-blue-500">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}
