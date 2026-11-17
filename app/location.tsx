import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { LocationMap } from "../src/components/map/LocationMap";
import { ConfirmSendModal } from "../src/components/modals/ConfirmSendModal";
import { LoadingModal } from "../src/components/modals/LoadingModal";
import { LocationModal } from "../src/components/modals/LocationModal";
import { StatusModal } from "../src/components/modals/StatusModal";
import { MediaCardSkeleton, SkeletonBox } from "../src/components/ui/Skeleton";

import { registerClient } from "../src/services/api";
import { getResponsiveSize } from "../src/utils/helpers";
import { clearSessionToken, getUserInfo } from "../src/utils/storage";

export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);
  const viewportHeightRef = useRef<number>(0);
  const contentHeightRef = useRef<number>(0);
  const card1YRef = useRef<number>(0);
  const pendingScrollRef = useRef<"NONE" | "CARD1_EXPANDED" | "BOTTOM" | "TOP">("NONE");

  const params = useLocalSearchParams();
  const [salespersonName, setSalespersonName] = useState(
    typeof params.salespersonName === "string" ? params.salespersonName : ""
  );
  const [salespersonPhone, setSalespersonPhone] = useState(
    typeof params.salespersonPhone === "string" ? params.salespersonPhone : ""
  );

  const placeCategory =
    typeof params.placeCategory === "string" && params.placeCategory.trim() !== ""
      ? params.placeCategory
      : "Establecimiento";

  const isBerel = placeCategory.toLowerCase().includes("berel");

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Estados para la fotografía de la fachada y sus esqueletos de carga
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isImageRendering, setIsImageRendering] = useState(false);
  const [isImagePreviewVisible, setIsImagePreviewVisible] = useState(false);

  const [mapRegion, setMapRegion] = useState({
    latitude: 32.5333,
    longitude: -117.0167,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isConfirmSendModalVisible, setIsConfirmSendModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [statusModalContent, setStatusModalContent] = useState<{
    title: string;
    message: string;
    isError: boolean;
    action?: "LOGOUT" | "NONE";
  }>({
    title: "",
    message: "",
    isError: false,
  });

  useEffect(() => {
    const loadUserAndPermissions = async () => {
      if (!salespersonName || !salespersonPhone) {
        const info = await getUserInfo();
        if (info) {
          if (!salespersonName) setSalespersonName(info.name || "Vendedor");
          if (!salespersonPhone) setSalespersonPhone(info.phone || "");
        }
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setStatusModalContent({
          title: "Permiso denegado",
          message: "Se necesita permiso de ubicación para usar esta función.",
          isError: true,
        });
        setIsStatusModalVisible(true);
      }
    };
    loadUserAndPermissions();
  }, [salespersonName, salespersonPhone]);

  const executeSmartScroll = (
    mode: "CARD1_EXPANDED" | "BOTTOM" | "TOP",
    hasPhotoOverride?: boolean
  ) => {
    if (!scrollViewRef.current) return;

    if (mode === "TOP") {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      return;
    }

    if (mode === "BOTTOM") {
      scrollViewRef.current.scrollToEnd({ animated: true });
      return;
    }

    if (mode === "CARD1_EXPANDED") {
      const viewportH = viewportHeightRef.current;
      const contentH = contentHeightRef.current;
      const card1Y = card1YRef.current;
      const hasPhoto = hasPhotoOverride ?? Boolean(photoUri);

      if (hasPhoto) {
        scrollViewRef.current.scrollTo({ x: 0, y: Math.max(0, card1Y - 12), animated: true });
      } else if (viewportH > 0 && contentH > viewportH) {
        const desiredBottomY = Math.max(0, contentH - viewportH);
        const maxCard1TopY = card1Y > 0 ? Math.max(0, card1Y - 12) : desiredBottomY;
        const targetY = Math.min(desiredBottomY, maxCard1TopY);
        scrollViewRef.current.scrollTo({ x: 0, y: targetY, animated: true });
      } else {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }
  };

  const triggerSmartScroll = (
    mode: "CARD1_EXPANDED" | "BOTTOM" | "TOP",
    delays: number[] = [60, 220],
    hasPhotoOverride?: boolean
  ) => {
    pendingScrollRef.current = mode;
    delays.forEach((delay) => {
      setTimeout(() => {
        executeSmartScroll(mode, hasPhotoOverride);
      }, delay);
    });
  };

  const handleConfirmAndGetLocation = async () => {
    setIsLocationModalVisible(false);
    setIsLocationLoading(true);
    triggerSmartScroll("CARD1_EXPANDED", [60, 220]);
    try {
      let position;
      try {
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("GPS_TIMEOUT")), 5000)
        );
        position = (await Promise.race([
          locationPromise,
          timeoutPromise,
        ])) as Location.LocationObject;
      } catch {
        position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      }
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      setMapRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 });
      triggerSmartScroll("CARD1_EXPANDED", [60, 220]);
    } catch {
      setStatusModalContent({
        title: "Error de Ubicación",
        message: "No se pudo obtener la ubicación. Asegúrate de que tu GPS esté activado.",
        isError: true,
      });
      setIsStatusModalVisible(true);
    } finally {
      setIsLocationLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setStatusModalContent({
          title: "Permiso de cámara",
          message: "Se necesita permiso de cámara para capturar la fotografía de la fachada.",
          isError: true,
        });
        setIsStatusModalVisible(true);
        return;
      }

      setIsPhotoLoading(true);
      triggerSmartScroll("BOTTOM", [60, 200]);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setIsImageRendering(true);
        setPhotoUri(asset.uri);
        if (asset.base64) {
          setPhotoBase64(asset.base64);
        }
        triggerSmartScroll("BOTTOM", [80, 260, 480]);
      }
    } catch {
      setStatusModalContent({
        title: "Error de cámara",
        message: "No se pudo tomar la foto. Intenta nuevamente.",
        isError: true,
      });
      setIsStatusModalVisible(true);
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setIsImageRendering(false);
  };

  const handleInitiateSend = () => {
    if (!location) {
      setStatusModalContent({
        title: "Ubicación requerida",
        message: `Por favor, obtén primero la ubicación del local de ${placeCategory}.`,
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }
    setIsConfirmSendModalVisible(true);
  };

  const executeSendEmail = async () => {
    setIsConfirmSendModalVisible(false);
    if (!location) return;
    setIsSubmitLoading(true);

    try {
      await registerClient({
        type: "LOCATION",
        place_category: placeCategory,
        client_number: placeCategory,
        client_name: placeCategory,
        latitude: location.latitude,
        longitude: location.longitude,
        photo_base64: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : undefined,
        salesperson_name: salespersonName || "Vendedor",
        salesperson_phone: salespersonPhone,
      });

      setStatusModalContent({
        title: "¡Éxito!",
        message: `La ubicación de ${placeCategory} se ha enviado correctamente.`,
        isError: false,
      });
      setIsStatusModalVisible(true);
    } catch (error: any) {
      if (error.message === "AUTH_ERROR") {
        await clearSessionToken();
        setStatusModalContent({
          title: "Sesión Revocada",
          message:
            "Tu acceso ha sido eliminado o el dispositivo ya no está autorizado. Por favor, vuelve a vincular tu celular.",
          isError: true,
          action: "LOGOUT",
        });
        setIsStatusModalVisible(true);
        return;
      }

      setStatusModalContent({
        title: "❌ Error de Envío",
        message: `No se pudo enviar el registro: ${error.message}`,
        isError: true,
      });
      setIsStatusModalVisible(true);
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalVisible(false);

    if (statusModalContent.action === "LOGOUT") {
      router.replace("/");
      return;
    }

    if (!statusModalContent.isError) {
      setLocation(null);
      setPhotoUri(null);
      setPhotoBase64(null);
      setIsImageRendering(false);
      triggerSmartScroll("TOP", [60]);
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Botón superior fijo hacia el Menú */}
      <View
        className="w-full bg-[#F8FAFC] z-10"
        style={{
          paddingHorizontal: getResponsiveSize(20),
          paddingTop: getResponsiveSize(8),
          paddingBottom: getResponsiveSize(8),
        }}
      >
        <View className="w-full max-w-[600px] self-center">
          <TouchableOpacity
            className="flex-row items-center self-start py-1.5 px-3 bg-white border border-gray-200 rounded-xl active:bg-gray-100"
            style={{ elevation: 1 }}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={16} color="#4B5563" />
            <Text
              className="font-roboto-medium text-gray-600 ml-1.5"
              style={{ fontSize: getResponsiveSize(13) }}
            >
              Menú
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        contentContainerStyle={{
          paddingHorizontal: getResponsiveSize(20),
          paddingTop: getResponsiveSize(5),
          paddingBottom: getResponsiveSize(20),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onLayout={(e) => {
          viewportHeightRef.current = e.nativeEvent.layout.height;
        }}
        onContentSizeChange={(_w, h) => {
          contentHeightRef.current = h;
          if (pendingScrollRef.current !== "NONE") {
            const mode = pendingScrollRef.current;
            pendingScrollRef.current = "NONE";
            requestAnimationFrame(() => {
              executeSmartScroll(mode);
            });
          }
        }}
      >
        <LocationModal
          isVisible={isLocationModalVisible}
          onClose={() => setIsLocationModalVisible(false)}
          onConfirm={handleConfirmAndGetLocation}
        />

        <ConfirmSendModal
          isVisible={isConfirmSendModalVisible}
          onClose={() => setIsConfirmSendModalVisible(false)}
          onConfirm={executeSendEmail}
          placeCategory={placeCategory}
          photoUri={photoUri}
          location={location}
        />

        <StatusModal
          isVisible={isStatusModalVisible}
          onClose={handleCloseStatusModal}
          title={statusModalContent.title}
          message={statusModalContent.message}
          isError={statusModalContent.isError}
        />

        <LoadingModal isVisible={isSubmitLoading} />

        <View className="w-full max-w-[600px] self-center">
          <View className="mb-4 items-center justify-center">
            {isBerel ? (
              <View
                className="bg-[#EB0029] overflow-hidden items-center justify-center mb-3 shadow-sm"
                style={{
                  width: getResponsiveSize(72),
                  height: getResponsiveSize(72),
                  borderRadius: getResponsiveSize(18),
                  elevation: 3,
                }}
              >
                <Image
                  source={require("../assets/images/berel.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View
                className="bg-blue-600 overflow-hidden items-center justify-center mb-3 shadow-sm"
                style={{
                  width: getResponsiveSize(72),
                  height: getResponsiveSize(72),
                  borderRadius: getResponsiveSize(18),
                  elevation: 3,
                }}
              >
                <Feather name="map-pin" size={32} color="#FFFFFF" />
              </View>
            )}

            <Text
              className="font-poppins-bold text-gray-800 text-center"
              style={{ fontSize: getResponsiveSize(20) }}
            >
              {placeCategory}
            </Text>
            <Text
              className="font-roboto text-gray-500 text-center mt-1"
              style={{
                fontSize: getResponsiveSize(14),
                lineHeight: getResponsiveSize(20),
              }}
            >
              Registra la ubicación del establecimiento para identificarlo en el mapa.
            </Text>
          </View>

          {/* Tarjeta 1: Ubicación y Mapa Unificados dentro del mismo recuadro blanco */}
          <View
            className="w-full bg-white border border-gray-200"
            style={{
              borderRadius: getResponsiveSize(16),
              padding: getResponsiveSize(18),
              marginBottom: getResponsiveSize(16),
            }}
            onLayout={(e) => {
              card1YRef.current = e.nativeEvent.layout.y;
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 pr-2">
                <Text
                  className="font-poppins-bold text-gray-700 uppercase tracking-wider"
                  style={{ fontSize: getResponsiveSize(13) }}
                >
                  1. Ubicación del Establecimiento
                </Text>
                <Text
                  className="font-roboto text-gray-500 mt-0.5"
                  style={{ fontSize: getResponsiveSize(12) }}
                >
                  {location
                    ? "Toca el mapa si deseas ajustar el punto exacto"
                    : "Captura la ubicación GPS actual del local"}
                </Text>
              </View>
            </View>

            {isLocationLoading && !isStatusModalVisible ? (
              <MediaCardSkeleton />
            ) : location ? (
              <LocationMap
                location={location}
                mapRegion={mapRegion}
                onLocationChange={(coords) => setLocation(coords)}
                onRefreshLocation={() => setIsLocationModalVisible(true)}
                markerTitle={placeCategory}
              />
            ) : (
              <TouchableOpacity
                className="flex-row items-center justify-center bg-blue-500 py-3.5 rounded-xl active:opacity-90"
                onPress={() => setIsLocationModalVisible(true)}
              >
                <Feather name="navigation" size={16} color="#FFFFFF" />
                <Text
                  className="font-roboto-medium text-white ml-2"
                  style={{ fontSize: getResponsiveSize(14) }}
                >
                  Obtener ubicación
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tarjeta 2: Fotografía de la fachada con Skeleton unificado */}
          <View
            className="w-full bg-white border border-gray-200"
            style={{
              borderRadius: getResponsiveSize(16),
              padding: getResponsiveSize(18),
              marginBottom: getResponsiveSize(16),
            }}
          >
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-1 pr-2">
                <Text
                  className="font-poppins-bold text-gray-700 uppercase tracking-wider"
                  style={{ fontSize: getResponsiveSize(13) }}
                >
                  2. Foto del establecimiento
                </Text>
                <Text
                  className="font-roboto text-gray-500 mt-0.5"
                  style={{ fontSize: getResponsiveSize(12) }}
                >
                  Toma una foto exterior del establecimiento
                </Text>
              </View>
            </View>

            {isPhotoLoading ? (
              <MediaCardSkeleton />
            ) : photoUri ? (
              <View
                className="w-full border border-gray-200 overflow-hidden"
                style={{ borderRadius: getResponsiveSize(12) }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setIsImagePreviewVisible(true)}
                  className="relative w-full bg-gray-100"
                  style={{ height: getResponsiveSize(180) }}
                >
                  {isImageRendering && (
                    <View className="absolute inset-0 z-10 bg-gray-100">
                      <SkeletonBox
                        width="100%"
                        height="100%"
                        borderRadius={0}
                        className="bg-gray-200 absolute inset-0"
                      />
                    </View>
                  )}
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                    onLoadEnd={() => {
                      setIsImageRendering(false);
                      executeSmartScroll("BOTTOM");
                    }}
                  />
                  <View className="absolute bottom-2.5 right-2.5 bg-black/60 px-2.5 py-1 rounded-lg flex-row items-center shadow-sm">
                    <Feather name="maximize-2" size={12} color="#FFFFFF" />
                    <Text
                      className="font-roboto-medium text-white ml-1.5"
                      style={{ fontSize: getResponsiveSize(11) }}
                    >
                      Toca para ampliar
                    </Text>
                  </View>
                </TouchableOpacity>

                <View className="flex-row items-center justify-between bg-gray-50 px-3 py-2 border-t border-gray-200">
                  <View className="flex-row items-center">
                    <Feather name="check-circle" size={15} color="#10B981" />
                    <Text
                      className="font-roboto-medium text-gray-700 ml-1.5"
                      style={{ fontSize: getResponsiveSize(12) }}
                    >
                      Foto capturada
                    </Text>
                  </View>
                  <View
                    className="flex-row items-center"
                    style={{ gap: getResponsiveSize(8) }}
                  >
                    <TouchableOpacity
                      className="py-1 px-3 bg-white border border-gray-300 rounded-lg active:bg-gray-100"
                      onPress={handleTakePhoto}
                    >
                      <Text
                        className="font-roboto text-gray-700"
                        style={{ fontSize: getResponsiveSize(12) }}
                      >
                        Cambiar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="py-1 px-3 bg-red-50 border border-red-200 rounded-lg active:bg-red-100"
                      onPress={handleRemovePhoto}
                    >
                      <Text
                        className="font-roboto-medium text-red-600"
                        style={{ fontSize: getResponsiveSize(12) }}
                      >
                        Quitar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center justify-center bg-gray-50 border border-dashed border-gray-300 py-3.5 rounded-xl active:bg-gray-100"
                onPress={handleTakePhoto}
              >
                <Feather name="camera" size={18} color="#2563EB" />
                <Text
                  className="font-roboto-medium text-blue-600 ml-2"
                  style={{ fontSize: getResponsiveSize(13) }}
                >
                  Tomar foto del local
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAwareScrollView>

      {/* Barra fija inferior de acción */}
      <View
        className="w-full bg-white border-t border-gray-200 z-20"
        style={{
          paddingHorizontal: getResponsiveSize(20),
          paddingTop: getResponsiveSize(10),
          paddingBottom: Math.max(insets.bottom, getResponsiveSize(4)),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 8,
        }}
      >
        <View className="w-full max-w-[600px] self-center">
          <TouchableOpacity
            className={`w-full flex-row items-center justify-center ${location && photoUri ? "bg-emerald-500 active:opacity-90" : "bg-gray-200"
              }`}
            style={{
              borderRadius: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(13),
            }}
            onPress={handleInitiateSend}
            disabled={!location || !photoUri || isSubmitLoading}
          >
            <Text
              className={`font-roboto-medium ${location && photoUri ? "text-white" : "text-gray-400"
                }`}
              style={{ fontSize: getResponsiveSize(14) }}
            >
              {isSubmitLoading ? "Enviando..." : "Enviar Registro"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Previsualización de Imagen a Pantalla Completa */}
      <Modal
        visible={isImagePreviewVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsImagePreviewVisible(false)}
      >
        <View className="flex-1 bg-black/95 justify-between">
          <SafeAreaView className="flex-row justify-between items-center px-4 py-2 border-b border-white/10">
            <View>
              <Text className="font-poppins-bold text-white text-base">
                Fachada del Establecimiento
              </Text>
              <Text className="font-roboto text-gray-400 text-xs">
                {placeCategory}
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 rounded-full bg-white/20 items-center justify-center active:bg-white/30"
              onPress={() => setIsImagePreviewVisible(false)}
            >
              <Feather name="x" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </SafeAreaView>

          <View className="flex-1 justify-center items-center p-2">
            {photoUri && (
              <Image
                source={{ uri: photoUri }}
                style={{ width: "100%", height: "90%" }}
                resizeMode="contain"
              />
            )}
          </View>

          <SafeAreaView className="items-center pb-4">
            <TouchableOpacity
              className="py-2.5 px-6 bg-white/20 rounded-full active:bg-white/30"
              onPress={() => setIsImagePreviewVisible(false)}
            >
              <Text className="font-roboto-medium text-white text-sm">
                Cerrar Previsualización
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
