import { useInventory } from "@/contexts/InventoryContext";
import { useSnackbar } from "@/components/ui/SnackbarProvider";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { X, Zap } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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
  const { showSnackbar } = useSnackbar();
  const [facing, setFacing] = useState<CameraType>("back");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCameraReady, setCameraReady] = useState(false);
  const [cameraTimedOut, setCameraTimedOut] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const [viewMode, setViewMode] = useState<"capture" | "review">("capture");
  const [currentImageIndex, setCurrentImageIndex] = useState<number | null>(
    null,
  );
  const router = useRouter();
  const { predictItemDimensions } = useInventory();
  const isFocused = useIsFocused();
  const [isPredicting, setIsPredicting] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setCameraReady(false);
      setCameraTimedOut(false);
      setTorchEnabled(false);
    }
  }, [isFocused]);

  useEffect(() => {
    if (viewMode !== "capture" || !isFocused || !permission?.granted || isCameraReady) {
      return;
    }

    setCameraTimedOut(false);
    const timer = setTimeout(() => {
      setCameraTimedOut(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, [viewMode, isFocused, permission?.granted, isCameraReady]);

  if (!permission) {
    return <View className="flex-1 bg-navy-950" />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-navy-950 p-6">
        <View className="items-center mb-8">
          <Ionicons
            name="camera-outline"
            size={80}
            color="#007FFF"
            className="mb-4"
          />
          <Text className="mb-2 text-center text-2xl font-bold text-azure-50">
            Camera Access Needed
          </Text>
          <Text className="text-center text-base text-azure-200">
            ShipWise needs camera access to automatically measure the dimensions
            of your items.
          </Text>
        </View>
        <TouchableOpacity
          className="rounded-full border border-azure-400/40 bg-azure-500 px-8 py-4 active:bg-azure-400"
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
    setCameraReady(true);
    setCameraTimedOut(false);
  };

  const onCameraError = (error: any) => {
    console.error("Camera error:", error);
    setCameraReady(false);
  };

  const captureWithBackup = async () => {
    if (cameraRef.current && isCameraReady) {
      return cameraRef.current.takePictureAsync({
        quality: 0.5,
        skipProcessing: true,
      });
    }

    throw new Error("Camera not ready");
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
          showSnackbar("Item Scanned Successfully", "success");
          router.replace({
            pathname: "/(tabs)/inventory",
            params: { prefill: JSON.stringify(prediction.data.prediction) },
          });
          setCapturedImages([]);
          setCurrentImageIndex(null);
          setViewMode("capture");
          setCameraReady(false);
        } else {
          showSnackbar("Scan Failed - Try Again", "error");
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

        showSnackbar("Scan Failed - Try Again", "error");
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
    setCameraReady(false);
  };

  const terminateAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const closeScanner = () => {
    router.replace("/(tabs)");
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar translucent backgroundColor="transparent" style="light" />

      {isPredicting && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-[#001224]/85">
          <View className="relative w-3/4 items-center rounded-[32px] border border-navy-800/30 bg-navy-900 p-8">
            <TouchableOpacity 
              className="absolute right-4 top-4 z-50 rounded-full bg-navy-950 p-2"
              onPress={terminateAnalysis}
            >
              <Ionicons name="close" size={24} color="#99CCFF" />
            </TouchableOpacity>
            <ActivityIndicator
              size="large"
              color="#007FFF"
              className="mb-6 transform scale-150"
            />
            <Text className="mb-2 text-center text-xl font-bold text-azure-50">
              Analyzing Item...
            </Text>
            <Text className="text-center text-sm text-azure-200">
              Our AI is currently measuring the dimensions, price, and brand of your item.
            </Text>
          </View>
        </View>
      )}

      {viewMode === "capture" ? (
        <View className="flex-1">
          {isFocused ? (
            <CameraView
              ref={cameraRef}
              className="flex-1"
              style={{ width: "100%", height: "100%" }}
              facing={facing}
              enableTorch={torchEnabled}
              onCameraReady={onCameraReady}
              onMountError={onCameraError}
            />
          ) : (
            <View className="flex-1 items-center justify-center bg-navy-900">
              <Text className="text-azure-200">Camera paused</Text>
            </View>
          )}

          {/* Header Floating Controls */}
          <SafeAreaView pointerEvents="box-none" className="absolute inset-x-0 top-0 z-30 px-6 pt-2">
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full border border-[#054161]/70 bg-[#001224]/85"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 8,
                }}
                onPress={closeScanner}
              >
                <X size={22} color="#E5F2FF" strokeWidth={2} />
              </TouchableOpacity>

              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full border border-[#054161]/70 bg-[#001224]/85"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 8,
                }}
                onPress={() => setTorchEnabled((current) => !current)}
              >
                <Zap
                  size={20}
                  strokeWidth={2}
                  color={torchEnabled ? "#007FFF" : "#E5F2FF"}
                  fill={torchEnabled ? "rgba(0,127,255,0.2)" : "transparent"}
                />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Viewfinder Overlay with dimmed surroundings */}
          <View className="pointer-events-none absolute inset-0 z-20 items-center justify-center px-8">
            <View className="w-full max-w-[340px] aspect-square">
              <View className="absolute -top-[999px] left-0 right-0 bottom-full bg-black/50" />
              <View className="absolute top-full left-0 right-0 -bottom-[999px] bg-black/50" />
              <View className="absolute top-0 bottom-0 -left-[999px] right-full bg-black/50" />
              <View className="absolute top-0 bottom-0 left-full -right-[999px] bg-black/50" />

              <View className="absolute inset-0 rounded-[36px] border-2 border-white/55" />
              <View className="absolute left-0 top-0 h-16 w-16 rounded-tl-[36px] border-l-4 border-t-4 border-white" />
              <View className="absolute right-0 top-0 h-16 w-16 rounded-tr-[36px] border-r-4 border-t-4 border-white" />
              <View className="absolute bottom-0 left-0 h-16 w-16 rounded-bl-[36px] border-b-4 border-l-4 border-white" />
              <View className="absolute bottom-0 right-0 h-16 w-16 rounded-br-[36px] border-b-4 border-r-4 border-white" />
            </View>

            <Text className="mt-8 rounded-full bg-[#001224]/70 px-4 py-2 text-center font-medium text-white/85">
              Position item clearly within the frame
            </Text>
          </View>

          {!isCameraReady && (
            <View className="absolute inset-0 z-40 items-center justify-center bg-[#001224]/68">
              <ActivityIndicator size="large" color="#007FFF" />
              <Text className="mt-4 text-center font-medium text-azure-50">
                {cameraTimedOut
                  ? "Scanner is taking longer than expected"
                  : "Initializing scanner..."}
              </Text>
              {cameraTimedOut && (
                <TouchableOpacity
                  className="mt-4 rounded-full border border-azure-400/40 bg-azure-500 px-4 py-2"
                  onPress={() => {
                    setCameraReady(false);
                    setCameraTimedOut(false);
                  }}
                >
                  <Text className="text-sm font-semibold text-white">Retry</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Bottom floating controls */}
          <View className="absolute inset-x-0 bottom-10 z-30 px-8">
            {capturedImages.length > 0 && (
              <View className="mb-4 h-20 justify-center">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {capturedImages.map((image, index) => (
                    <TouchableOpacity
                      key={image}
                      onPress={() => {
                        setCurrentImageIndex(index);
                        setViewMode("review");
                      }}
                      className={`mr-3 overflow-hidden rounded-2xl border-2 ${currentImageIndex === index ? "border-azure-500" : "border-navy-800/40"}`}
                    >
                      <Image source={{ uri: image }} className="h-16 w-16" resizeMode="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                className="h-14 w-14 items-center justify-center rounded-full border border-[#054161]/70 bg-[#001224]/85"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 8,
                }}
                onPress={pickImage}
              >
                <Ionicons name="images" size={24} color="#E5F2FF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  width: 96,
                  height: 96,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 12,
                  elevation: 10,
                }}
                className="items-center justify-center rounded-full border-4 border-azure-400"
                onPress={takePicture}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.7}
              >
                <View style={{ width: 76, height: 76 }} className="rounded-full bg-azure-500" />
              </TouchableOpacity>

              <TouchableOpacity
                className="h-14 w-14 items-center justify-center rounded-full border border-[#054161]/70 bg-[#001224]/85"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 8,
                }}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={24} color="#E5F2FF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-1 items-center justify-center bg-black">
          {currentImageIndex !== null && capturedImages[currentImageIndex] ? (
            <>
              <Image
                source={{ uri: capturedImages[currentImageIndex] }}
                className="h-full w-full"
                resizeMode="contain"
              />

              <SafeAreaView pointerEvents="box-none" className="absolute inset-x-0 top-0 z-20 px-6 pt-2">
                <TouchableOpacity
                  className="h-12 w-12 items-center justify-center rounded-full border border-[#054161]/70 bg-[#001224]/85"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.35,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                  onPress={backToCapture}
                >
                  <X size={22} color="#E5F2FF" strokeWidth={2} />
                </TouchableOpacity>
              </SafeAreaView>

              <View className="absolute inset-x-0 bottom-10 z-20 flex-row items-center justify-center gap-12">
                <TouchableOpacity
                  className="h-20 w-20 items-center justify-center rounded-full border border-navy-800/30 bg-navy-900"
                  onPress={rejectImage}
                >
                  <Ionicons name="trash" size={32} color="#99CCFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  className="h-20 w-20 items-center justify-center rounded-full border border-azure-400/45 bg-azure-500"
                  onPress={acceptImage}
                >
                  <Ionicons name="checkmark-done" size={38} color="white" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="mb-6 text-lg text-azure-200">No image available</Text>
              <TouchableOpacity
                className="rounded-full border border-azure-400/40 bg-azure-500 px-8 py-4"
                onPress={backToCapture}
              >
                <Text className="text-base font-bold text-white">Return to Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}
