import React, { useState } from "react";
import { Text, TextInput, View, TextInputProps } from "react-native";

interface FormFieldProps extends TextInputProps {
  label: string;
  className?: string;
  containerClassName?: string;
  required?: boolean;
  minLength?: number;
  validator?: (value: string) => string | null;
}

export default function FormField({
  label,
  className,
  containerClassName,
  required,
  minLength,
  validator,
  ...props
}: Readonly<FormFieldProps>) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const rawValue = typeof props.value === "string" ? props.value : "";

  const warningMessage = (() => {
    if (!hasInteracted) return null;

    if (required && !rawValue.trim()) {
      return "This field is required";
    }

    if (minLength && rawValue && rawValue.length < minLength) {
      return `Enter at least ${minLength} characters`;
    }

    if (props.keyboardType === "email-address" && rawValue) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawValue);
      if (!isEmail) {
        return "Enter a valid email address";
      }
    }

    if (props.keyboardType === "numeric" && rawValue) {
      if (Number.isNaN(Number(rawValue))) {
        return "Enter a valid number";
      }
    }

    return validator?.(rawValue) ?? null;
  })();

  let borderClass = "border-navy-800/30";
  if (warningMessage) {
    borderClass = "border-[#D58F3C]";
  } else if (isFocused) {
    borderClass = "border-azure-500";
  }

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="mb-1.5 ml-1 text-sm font-medium text-azure-200">
        {label}
      </Text>
      <TextInput
        className={`rounded-card border p-4 text-base text-azure-50 bg-navy-900 ${borderClass} ${className}`}
        placeholderTextColor="#99CCFF"
        selectionColor="#3399FF"
        onChangeText={(text) => {
          setHasInteracted(true);
          props.onChangeText?.(text);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          setHasInteracted(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {warningMessage && (
        <Text className="mt-1 ml-1 text-xs text-[#D9A35A]">{warningMessage}</Text>
      )}
    </View>
  );
}
