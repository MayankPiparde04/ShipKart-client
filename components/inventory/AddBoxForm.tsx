import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import FormField from "../ui/FormField";
import FormModal from "../ui/FormModal";

interface AddBoxFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  newBox: {
    box_name: string;
    length: string;
    breadth: string;
    height: string;
    quantity: string;
    max_weight: string;
  };
  setNewBox: (box: any) => void;
  isAdding: boolean;
}

export default function AddBoxForm({
  visible,
  onClose,
  onSubmit,
  newBox,
  setNewBox,
  isAdding,
}: AddBoxFormProps) {
  const handleChange = (key: string, value: string) => {
    setNewBox({ ...newBox, [key]: value });
  };

  return (
    <FormModal visible={visible} onClose={onClose} title="Add New Box">
      <View className="space-y-2">
        <FormField
          label="Box Name"
          placeholder="e.g. Large Shipping Box"
          value={newBox.box_name}
          onChangeText={(t) => handleChange("box_name", t)}
          required
          minLength={2}
        />

        <View className="flex-row gap-3">
          <FormField
            label="Quantity"
            placeholder="0"
            keyboardType="numeric"
            value={newBox.quantity}
            onChangeText={(t) => handleChange("quantity", t)}
            containerClassName="flex-1"
            required
            validator={(value) =>
              value && Number(value) < 1 ? "Quantity must be at least 1" : null
            }
          />
          <FormField
            label="Max Weight (kg)"
            placeholder="0"
            keyboardType="numeric"
            value={newBox.max_weight}
            onChangeText={(t) => handleChange("max_weight", t)}
            containerClassName="flex-1"
            required
          />
        </View>

        <View>
          <Text className="mb-2 ml-1 text-sm font-medium text-azure-200">
            Dimensions (cm)
          </Text>
          <View className="flex-row gap-3">
            <FormField
              label=""
              placeholder="L"
              keyboardType="numeric"
              value={newBox.length}
              onChangeText={(t) => handleChange("length", t)}
              containerClassName="flex-1"
              className="text-center"
              required
            />
            <FormField
              label=""
              placeholder="B"
              keyboardType="numeric"
              value={newBox.breadth}
              onChangeText={(t) => handleChange("breadth", t)}
              containerClassName="flex-1"
              className="text-center"
              required
            />
            <FormField
              label=""
              placeholder="H"
              keyboardType="numeric"
              value={newBox.height}
              onChangeText={(t) => handleChange("height", t)}
              containerClassName="flex-1"
              className="text-center"
              required
            />
          </View>
        </View>

        <TouchableOpacity
          className="mt-6 flex-row items-center justify-center rounded-xl border border-azure-400/40 bg-azure-500 p-4"
          onPress={onSubmit}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator color="white" className="mr-2" />
          ) : (
            <Ionicons
              name="add-circle-outline"
              size={24}
              color="white"
              className="mr-2"
            />
          )}
          <Text className="text-white font-bold text-lg">
            {isAdding ? "Adding Box..." : "Add Box"}
          </Text>
        </TouchableOpacity>
      </View>
    </FormModal>
  );
}
