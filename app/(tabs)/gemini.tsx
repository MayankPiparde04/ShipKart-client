import { useColorScheme } from "@/hooks/useColorScheme";

import { useInventory } from "@/contexts/InventoryContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCameraReady, setCameraReady] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const [viewMode, setViewMode] = useState<"capture" | "review">("capture");
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null,
  );
  const router = useRouter();
  const { predictItemDimensions } = useInventory();
  const [isPredicting, setIsPredicting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset camera state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setCameraReady(false);
    }, []),
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-slate-900 justify-center items-center p-6">
        <View className="items-center mb-8">
          <Ionicons
            name="camera-outline"
            size={80}
            color={isDark ? "#818cf8" : "#4f46e5"}
            className="mb-4"
          />
          <Text className="text-slate-900 dark:text-white text-2xl font-bold mb-2 text-center">
            Camera Access Needed
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-center text-base">
            ShipWise needs camera access to automatically measure the dimensions
            of your items.
          </Text>
        </View>
        <TouchableOpacity
          className="bg-indigo-600 dark:bg-indigo-500 py-4 px-8 rounded-full shadow-lg shadow-indigo-500/30 active:bg-indigo-700"
          onPress={requestPermission}
        >
          <Text className="text-white font-bold text-lg tracking-wide">
            Grant Permission
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const onCameraReady = () => {
    // Delay state update to avoid Reanimated crashing during rapid mount layout shifts
    setTimeout(() => {
      setCameraReady(true);
    }, 50);
  };

  const onCameraError = (error: any) => {
    console.error("Camera error:", error);
    setCameraReady(false);
  };

  const captureWithBackup = async () => {
    try {
      if (cameraRef.current && isCameraReady) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          skipProcessing: true,
        });
        return photo;
      }
      throw new Error("Camera not ready");
    } catch (error) {
      throw error;
    }
  };

  const takePicture = async () => {
    if (!isCameraReady) {
      Alert.alert("Camera Initialising", "Please wait a moment.");
      return;
    }

    try {
      const photo = await captureWithBackup();
      // Update all state together — safe because takePictureAsync is already async
      setCapturedImages((prev) => [...prev, photo.uri]);
      setCurrentImageIndex(capturedImages.length);
      setViewMode("review");
    } catch (error) {
      console.error("Failed to take picture:", error);
      Alert.alert(
        "Capture Failed",
        "Failed to capture image. Would you like to select from gallery instead?",
        [
          { text: "Gallery", onPress: pickImage },
          { text: "Cancel", style: "cancel" },
        ],
      );
    }
  };

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUri = result.assets[0].uri;
        const newIndex = capturedImages.length;
        setCapturedImages((prevImages) => [...prevImages, newImageUri]);
        setCurrentImageIndex(newIndex);
        setViewMode("review");
      }
    } catch (error) {
      console.error("Error picking image from gallery:", error);
      Alert.alert(
        "Gallery Error",
        "There was a problem accessing your gallery. Please try again.",
      );
    }
  };

  const acceptImage = async () => {
    if (currentImageIndex !== null && capturedImages[currentImageIndex]) {
      const imageUri = capturedImages[currentImageIndex];
      setIsPredicting(true);
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      try {
        const prediction = await predictItemDimensions(
          imageUri,
          "coin",
          "cm",
          "Product for shipping dimension analysis",
          controller.signal
        );
        setIsPredicting(false);

        if (prediction?.success && prediction?.data?.prediction) {
          router.replace({
            pathname: "/(tabs)/inventory",
            params: { prefill: JSON.stringify(prediction.data.prediction) },
          });
          setCapturedImages([]);
          setCurrentImageIndex(null);
          setViewMode("capture");
          setCameraReady(false);
        } else {
          Alert.alert(
            "Analysis Failed",
            prediction?.message ||
              "Unable to analyze the image. Please try with a clearer image or different lighting.",
          );
          setCapturedImages([]);
          setCurrentImageIndex(null);
          setViewMode("capture");
          setCameraReady(false);
        }
      } catch (error: any) {
        setIsPredicting(false);
        abortControllerRef.current = null;
        
        if (error?.message === 'Prediction cancelled by user') {
           // User manually aborted it, so just exit cleanly
           return;
        }

        Alert.alert(
          "AI Analysis Error",
          error?.message ||
            "Failed to analyze the image. Please check your connection and try again.",
          [
            { text: "Retry", onPress: () => acceptImage() },
            { text: "Cancel", style: "cancel", onPress: () => backToCapture() },
          ],
        );
      }
    } else {
      Alert.alert(
        "No Image",
        "Please capture or select an image before proceeding.",
      );
    }
  };

  const rejectImage = () => {
    if (currentImageIndex !== null) {
      setCapturedImages((prevImages) =>
        prevImages.filter((_, index) => index !== currentImageIndex),
      );

      if (capturedImages.length <= 1) {
        setViewMode("capture");
        setCurrentImageIndex(null);
      } else {
        setCurrentImageIndex(Math.max(0, currentImageIndex - 1));
      }
    }
  };

  const backToCapture = () => {
    setViewMode("capture");
  };

  const terminateAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar translucent backgroundColor="transparent" style="light" />

      {isPredicting && (
        <View className="absolute z-50 inset-0 justify-center items-center bg-black/80 backdrop-blur-sm">
          <View className="bg-slate-900/90 p-8 rounded-[32px] items-center border border-slate-700 w-3/4 relative">
            <TouchableOpacity 
              className="absolute top-4 right-4 z-50 p-2 bg-slate-800 rounded-full"
              onPress={terminateAnalysis}
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
            <ActivityIndicator
              size="large"
              color="#818cf8"
              className="mb-6 transform scale-150"
            />
            <Text className="text-white text-xl font-bold mb-2 text-center">
              Analyzing Item...
            </Text>
            <Text className="text-slate-400 text-center text-sm">
              Our AI is currently measuring the dimensions, price, and brand of your item.
            </Text>
          </View>
        </View>
      )}

      {/* Main View Area */}
      <View
        className="flex-1 overflow-hidden"
        style={{ borderBottomLeftRadius: 40, borderBottomRightRadius: 40 }}
      >
        {viewMode === "capture" ? (
          <View className="flex-1 relative ">
            {!isCameraReady && (
              <View className="absolute inset-0 z-10 flex items-center justify-center ">
                <ActivityIndicator
                  size="large"
                  color="#ffffff"
                  className="mb-4"
                />
                <Text className="text-white font-medium">
                  Initializing scanner...
                </Text>
              </View>
            )}

            <CameraView
              ref={cameraRef}
              className="flex-1"
              style={{ width: "100%", height: "100%" }}
              facing={facing}
              onCameraReady={onCameraReady}
              onMountError={onCameraError}
            />

            {/* Viewfinder Overlay */}
            <View className="absolute inset-0 z-10 flex-1 justify-center items-center p-8 pointer-events-none">
              <View className="w-full aspect-square border-2 border-white/50 rounded-[40px] relative">
                <View className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-white rounded-tl-[40px]" />
                <View className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-white rounded-tr-[40px]" />
                <View className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-white rounded-bl-[40px]" />
                <View className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-white rounded-br-[40px]" />
              </View>
              <Text className="text-white/80 font-medium text-center mt-8  px-4 py-2 rounded-full">
                Position item clearly within the frame
              </Text>
            </View>
          </View>
        ) : (
          <View className="flex-1 justify-center items-center relative">
            {currentImageIndex !== null && capturedImages[currentImageIndex] ? (
              <>
                <Image
                  source={{ uri: capturedImages[currentImageIndex] }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
                <View className="absolute top-16 left-6 z-10">
                  <TouchableOpacity
                    className="w-12 h-12 rounded-full items-center justify-center backdrop-blur-md"
                    onPress={backToCapture}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View className="flex-1 justify-center items-center">
                <Text className="text-slate-400 text-lg mb-6">
                  No image available
                </Text>
                <TouchableOpacity
                  className="bg-indigo-600 px-8 py-4 rounded-full shadow-lg"
                  onPress={backToCapture}
                >
                  <Text className="text-white font-bold text-base">
                    Return to Camera
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Controls Area */}
      <View className="h-[22%] bg-black justify-center pb-6">
        {viewMode === "capture" ? (
          <View className="flex-1 justify-center">
            {/* Captured Images Preview Strip */}
            {capturedImages.length > 0 && (
              <View className="h-20 mb-4 px-6 justify-center">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {capturedImages.map((image, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setCurrentImageIndex(index);
                        setViewMode("review");
                      }}
                      className={`mr-3 rounded-2xl overflow-hidden border-2 ${currentImageIndex === index ? "border-indigo-500" : "border-slate-800"}`}
                    >
                      <Image
                        source={{ uri: image }}
                        className="w-16 h-16"
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Main Controls */}
            <View className="flex-row justify-between items-center px-10">
              <TouchableOpacity
                className="w-14 h-14 bg-slate-800 rounded-full justify-center items-center"
                onPress={pickImage}
              >
                <Ionicons name="images" size={24} color="white" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{ width: 96, height: 96 }}
                className="rounded-full border-4 border-red-500 justify-center items-center"
                onPress={takePicture}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.7}
              >
                <View
                  style={{ width: 76, height: 76 }}
                  className="bg-white rounded-full"
                />
              </TouchableOpacity>

              <TouchableOpacity
                className="w-14 h-14 bg-slate-800 rounded-full justify-center items-center"
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 flex-row justify-center items-center space-x-12">
            <TouchableOpacity
              className="w-20 h-20 rounded-full bg-rose-500 justify-center items-center shadow-lg shadow-rose-500/30"
              onPress={rejectImage}
            >
              <Ionicons name="trash" size={32} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className="w-20 h-20 rounded-full bg-emerald-500 justify-center items-center shadow-lg shadow-emerald-500/30"
              onPress={acceptImage}
            >
              <Ionicons name="checkmark-done" size={38} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
