import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Keyboard, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ClientForm } from "../src/components/form/ClientForm";
import { ConfirmSendModal } from "../src/components/modals/ConfirmSendModal";
import { LoadingModal } from "../src/components/modals/LoadingModal";
import { LocationModal } from "../src/components/modals/LocationModal";
import { StatusModal } from "../src/components/modals/StatusModal";

import { registerClient } from "../src/services/api";
import { formatClientPhone, formatProperCase, getResponsiveSize } from "../src/utils/helpers";
import { clearSessionToken } from "../src/utils/storage";

export default function FormScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const pendingScrollRef = useRef<"NONE" | "BOTTOM" | "TOP">("NONE");
  const focusedFieldRef = useRef<"number" | "name" | "phone" | null>(null);
  const currentScrollYRef = useRef(0);
  const [lockedBottomY, setLockedBottomY] = useState<number | null>(null);
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const executeSmartScroll = useCallback((mode: "BOTTOM" | "TOP") => {
    if (!scrollViewRef.current) return;
    if (mode === "TOP") {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    } else {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  const triggerSmartScroll = useCallback(
    (mode: "BOTTOM" | "TOP", delays: number[] = [60, 220]) => {
      pendingScrollRef.current = mode;
      delays.forEach((delay) => {
        setTimeout(() => {
          executeSmartScroll(mode);
        }, delay);
      });
    },
    [executeSmartScroll]
  );

  // Recibir parámetros de la ruta
  const params = useLocalSearchParams();
  const salespersonName = typeof params.salespersonName === "string" ? params.salespersonName : "";
  const salespersonPhone = typeof params.salespersonPhone === "string" ? params.salespersonPhone : "";

  // --- Estados del Formulario ---
  const [clientNumber, setClientNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [contactMethod, setContactMethod] = useState<"phone" | "gps" | "both">("phone");

  // --- Estados del Mapa ---
  const [mapRegion, setMapRegion] = useState({
    latitude: 32.5333,
    longitude: -117.0167,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // --- Estados de Modales ---
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

  // --- Lógica de Ubicación ---
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setStatusModalContent({
          title: "Permiso denegado",
          message: "Se necesita permiso de ubicación para usar esta función.",
          isError: true,
        });
        setIsStatusModalVisible(true);
      }
    })();
  }, []);

  const handleConfirmAndGetLocation = async () => {
    Keyboard.dismiss();
    setIsLocationModalVisible(false);
    setIsLocationLoading(true);
    triggerSmartScroll("BOTTOM", [60, 220]);
    try {
      let position;
      try {
        // Intento 1: Alta precisión
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("GPS_TIMEOUT")), 5000));
        position = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      } catch {
        // Intento 2: Fallback a precisión media
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      setMapRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      triggerSmartScroll("BOTTOM", [60, 220]);
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

  const handleContactMethodChange = (method: "phone" | "gps" | "both") => {
    setContactMethod(method);
    if (method === "gps" || method === "both") {
      Keyboard.dismiss();
      triggerSmartScroll("BOTTOM", [60, 220]);
    }
  };

  // Validación de teléfono en tiempo real
  const phoneError = useMemo(() => {
    const rawPhone = clientPhone.replace(/\D/g, "");
    if (rawPhone.length >= 10) {
      const isRepeated = /^(\d)\1{9}$/.test(rawPhone);
      if (isRepeated) {
        return "No uses el mismo número repetido.";
      }
      const phoneNumber = parsePhoneNumberFromString(rawPhone, 'MX');
      if (!phoneNumber || !phoneNumber.isValid()) {
        return "El número ingresado no es un celular válido.";
      }
    }
    return "";
  }, [clientPhone]);

  const scrollToFocusedField = useCallback(
    (field: "number" | "name" | "phone") => {
      if (!scrollViewRef.current) return;
      if (field === "number") {
        if (currentScrollYRef.current > getResponsiveSize(60)) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      } else if (field === "name") {
        scrollViewRef.current.scrollTo({
          y: getResponsiveSize(75),
          animated: true,
        });
      } else if (field === "phone") {
        if (contactMethod === "phone") {
          scrollViewRef.current.scrollToEnd({ animated: true });
        } else {
          scrollViewRef.current.scrollTo({
            y: getResponsiveSize(310),
            animated: true,
          });
        }
      }
    },
    [contactMethod]
  );

  const handleInputFocus = useCallback(
    (field: "number" | "name" | "phone") => {
      focusedFieldRef.current = field;
      if (isKeyboardVisible) {
        setTimeout(() => {
          scrollToFocusedField(field);
        }, 50);
      }
    },
    [isKeyboardVisible, scrollToFocusedField]
  );

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
      const field = focusedFieldRef.current;
      if (field) {
        setTimeout(() => {
          scrollToFocusedField(field);
        }, 40);
        setTimeout(() => {
          scrollToFocusedField(field);
        }, 160);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      focusedFieldRef.current = null;
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [scrollToFocusedField]);

  useEffect(() => {
    if (phoneError) {
      scrollToFocusedField("phone");
    }
  }, [phoneError, scrollToFocusedField]);

  const handleInitiateSend = () => {
    Keyboard.dismiss();
    if (!isBasicInfoFilled) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, ingresa el número y nombre del cliente.",
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }

    if (phoneError) {
      setStatusModalContent({
        title: "Teléfono Inválido",
        message: phoneError,
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }

    if ((contactMethod === "phone" || contactMethod === "both") && !hasPhone) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, ingresa el teléfono del cliente.",
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }

    if ((contactMethod === "gps" || contactMethod === "both") && !hasLocation) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, confirma la ubicación.",
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }

    setIsConfirmSendModalVisible(true);
  };

  const executeSendEmail = async () => {
    setIsConfirmSendModalVisible(false);
    setIsSubmitLoading(true);
    if (!salespersonName) return;

    try {
      await registerClient({
        type: "CLIENT",
        client_number: clientNumber.trim(),
        client_name: formatProperCase(clientName.trim()),
        client_phone: clientPhone || undefined,
        latitude: location?.latitude,
        longitude: location?.longitude,
        salesperson_name: salespersonName,
        salesperson_phone: salespersonPhone,
      });

      setStatusModalContent({
        title: "¡Éxito!",
        message: "El registro se ha enviado correctamente.",
        isError: false,
      });
      setIsStatusModalVisible(true);
    } catch (error: any) {
      if (error.message === "AUTH_ERROR") {
        await clearSessionToken();
        setStatusModalContent({
          title: "Sesión Revocada",
          message: "Tu acceso ha sido eliminado o el dispositivo ya no está autorizado. Por favor, vuelve a vincular tu celular.",
          isError: true,
          action: "LOGOUT"
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
      setClientName("");
      setClientPhone("");
      setClientNumber("");
      setLocation(null);
      setContactMethod("phone");
      triggerSmartScroll("TOP", [60]);
    }
  };

  const isBasicInfoFilled = clientNumber.trim() !== "" && clientName.trim() !== "";
  const hasPhone = clientPhone.replace(/[^0-9]/g, "").length === 10;
  const hasLocation = location !== null;

  const isFormComplete =
    isBasicInfoFilled && !phoneError &&
    (contactMethod === "both" ? hasPhone && hasLocation : true) &&
    (contactMethod === "phone" ? hasPhone : true) &&
    (contactMethod === "gps" ? hasLocation : true);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

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

      <ScrollView
        ref={scrollViewRef}
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          marginBottom: isKeyboardVisible ? 0 : bottomBarHeight,
        }}
        contentContainerStyle={{
          paddingHorizontal: getResponsiveSize(20),
          paddingTop: getResponsiveSize(5),
          paddingBottom: getResponsiveSize(4),
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        onScroll={(e) => {
          currentScrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        onContentSizeChange={() => {
          if (pendingScrollRef.current !== "NONE") {
            const mode = pendingScrollRef.current;
            pendingScrollRef.current = "NONE";
            requestAnimationFrame(() => {
              executeSmartScroll(mode);
            });
          } else if (
            isKeyboardVisible &&
            focusedFieldRef.current === "phone" &&
            contactMethod === "phone"
          ) {
            requestAnimationFrame(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
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
          clientNumber={clientNumber}
          clientName={clientName}
          clientPhone={clientPhone}
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
            <View
              className="bg-[#F49121] overflow-hidden items-center justify-center mb-3 shadow-sm"
              style={{
                width: getResponsiveSize(72),
                height: getResponsiveSize(72),
                borderRadius: getResponsiveSize(18),
                elevation: 3,
              }}
            >
              <Image
                source={require("../assets/images/company-menu-icon.png")}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            </View>
            <Text
              className="font-poppins-bold text-gray-800 text-center"
              style={{ fontSize: getResponsiveSize(20) }}
            >
              Registro de Cliente
            </Text>
            <Text
              className="font-roboto text-gray-500 text-center mt-1"
              style={{
                fontSize: getResponsiveSize(14),
                lineHeight: getResponsiveSize(20),
              }}
            >
              Ingresa los datos para registrar un nuevo cliente.
            </Text>
          </View>

          <ClientForm
            clientNumber={clientNumber}
            clientName={clientName}
            clientPhone={clientPhone}
            phoneError={phoneError}
            onClientNumberChange={(text) => setClientNumber(text.replace(/[^0-9]/g, ""))}
            onClientNameChange={(text) => setClientName(text.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""))}
            onClientPhoneChange={(text) => setClientPhone(formatClientPhone(text))}
            isLocationLoading={isLocationLoading}
            isStatusModalVisible={isStatusModalVisible}
            location={location}
            mapRegion={mapRegion}
            onLocationChange={(coords) => setLocation(coords)}
            onGetLocation={() => setIsLocationModalVisible(true)}
            isBasicInfoFilled={isBasicInfoFilled}
            contactMethod={contactMethod}
            onContactMethodChange={handleContactMethodChange}
            onInputFocus={handleInputFocus}
          />
        </View>
      </ScrollView>

      {/* Barra fija inferior de acción */}
      <View
        className="w-full bg-white border-t border-gray-200 z-20"
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          if (lockedBottomY === null && y > 0) {
            setLockedBottomY(y);
          }
          if (height > 0 && height !== bottomBarHeight) {
            setBottomBarHeight(height);
          }
        }}
        style={[
          {
            paddingHorizontal: getResponsiveSize(20),
            paddingTop: getResponsiveSize(10),
            paddingBottom: Math.max(insets.bottom, getResponsiveSize(4)),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -3 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 8,
          },
          lockedBottomY !== null
            ? {
              position: "absolute",
              top: lockedBottomY,
              left: 0,
              right: 0,
            }
            : null,
        ]}
      >
        <View className="w-full max-w-[600px] self-center">
          <TouchableOpacity
            className={`w-full flex-row items-center justify-center ${isFormComplete ? "bg-emerald-500 active:opacity-90" : "bg-gray-200"
              }`}
            style={{
              borderRadius: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(11),
            }}
            onPress={handleInitiateSend}
            disabled={!isFormComplete || isSubmitLoading}
          >
            <Text
              className={`font-roboto-medium ${isFormComplete ? "text-white" : "text-gray-400"
                }`}
              style={{ fontSize: getResponsiveSize(14) }}
            >
              {isSubmitLoading ? "Enviando..." : "Enviar Registro"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
