import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import FormField from "../ui/FormField";
import FormModal from "../ui/FormModal";

interface AddItemFormProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  newItem: {
    productName: string;
    quantity: string;
    weight: string;
    price: string;
    length: string;
    breadth: string;
    height: string;
    category: string;
    brand: string;
  };
  setNewItem: (item: any) => void;
  isAdding: boolean;
  isEditMode?: boolean;
}

export default function AddItemForm({
  visible,
  onClose,
  onSubmit,
  newItem,
  setNewItem,
  isAdding,
  isEditMode = false,
}: Readonly<AddItemFormProps>) {
  const handleChange = (key: string, value: string) => {
    setNewItem({ ...newItem, [key]: value });
  };

  let submitLabel = "Add Item";
  if (isAdding && isEditMode) {
    submitLabel = "Updating Item...";
  } else if (isAdding && !isEditMode) {
    submitLabel = "Adding Item...";
  } else if (!isAdding && isEditMode) {
    submitLabel = "Update Item";
  }

  return (
    <FormModal
      visible={visible}
      onClose={onClose}
      title={isEditMode ? "Update Item" : "Add New Item"}
    >
      <View className="space-y-2">
        <FormField
          label="Product Name"
          placeholder="e.g. Wireless Headphones"
          value={newItem.productName}
          onChangeText={(t) => handleChange("productName", t)}
          required
          minLength={2}
        />

        <View className="flex-row gap-3">
          <FormField
            label="Brand"
            placeholder="e.g. Sony"
            value={newItem.brand}
            onChangeText={(t) => handleChange("brand", t)}
            containerClassName="flex-1"
          />
          <FormField
            label="Category"
            placeholder="e.g. Electronics"
            value={newItem.category}
            onChangeText={(t) => handleChange("category", t)}
            containerClassName="flex-1"
          />
        </View>

        <View className="flex-row gap-3">
          <FormField
            label="Quantity"
            placeholder="0"
            keyboardType="numeric"
            value={newItem.quantity}
            onChangeText={(t) => handleChange("quantity", t)}
            containerClassName="flex-1"
            required
            validator={(value) =>
              value && Number(value) < 1 ? "Quantity must be at least 1" : null
            }
          />
          <FormField
            label="Price ($)"
            placeholder="0.00"
            keyboardType="numeric"
            value={newItem.price}
            onChangeText={(t) => handleChange("price", t)}
            containerClassName="flex-1"
            required
          />
        </View>

        <FormField
          label="Weight (g)"
          placeholder="0"
          keyboardType="numeric"
          value={newItem.weight}
          onChangeText={(t) => handleChange("weight", t)}
          required
        />

        <View>
          <Text className="mb-2 ml-1 text-sm font-medium text-azure-200">
            Dimensions (cm)
          </Text>
          <View className="flex-row gap-3">
            <FormField
              label=""
              placeholder="L"
              keyboardType="numeric"
              value={newItem.length}
              onChangeText={(t) => handleChange("length", t)}
              containerClassName="flex-1"
              className="text-center"
              required
            />
            <FormField
              label=""
              placeholder="B"
              keyboardType="numeric"
              value={newItem.breadth}
              onChangeText={(t) => handleChange("breadth", t)}
              containerClassName="flex-1"
              className="text-center"
              required
            />
            <FormField
              label=""
              placeholder="H"
              keyboardType="numeric"
              value={newItem.height}
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
            {submitLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </FormModal>
  );
}
