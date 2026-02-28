import React from "react";
import { Text, TextInput, View, TextInputProps } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  className?: string;
  containerClassName?: string;
}

export default function FormField({
  label,
  className,
  containerClassName,
  ...props
}: FormFieldProps) {
  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
        {label}
      </Text>
      <TextInput
        className={`bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-900 dark:text-white text-base ${className}`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}
