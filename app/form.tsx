import * as Location from "expo-location";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

import { ClientForm } from "../src/components/form/ClientForm";
import { LocationMap } from "../src/components/map/LocationMap";
import { ConfirmSendModal } from "../src/components/modals/ConfirmSendModal";
import { LoadingModal } from "../src/components/modals/LoadingModal";
import { LocationModal } from "../src/components/modals/LocationModal";
import { StatusModal } from "../src/components/modals/StatusModal";

import { registerClient } from "../src/services/api";
import { formatClientPhone, formatProperCase, getResponsiveSize } from "../src/utils/helpers";
import { clearSessionToken } from "../src/utils/storage";

export default function FormScreen() {
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);

  // Recibir parámetros de la ruta
  const params = useLocalSearchParams();
  const salespersonName = typeof params.salespersonName === "string" ? params.salespersonName : "";
  const salespersonPhone = typeof params.salespersonPhone === "string" ? params.salespersonPhone : "";

  // --- Estados del Formulario ---
  const [clientNumber, setClientNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
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
    setIsLocationModalVisible(false);
    setIsLocationLoading(true);
    try {
      let position;
      try {
        // Intento 1: Alta precisión (tarda más, consume más batería) con timeout de 5s
        const locationPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("GPS_TIMEOUT")), 5000));
        position = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;
      } catch {
        // Intento 2: Fallback a precisión media (torres celulares/wifi) si el GPS puro falla
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const coords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(coords);
      setMapRegion({ ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 });
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd(true);
      }, 500);
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

  // Validación de teléfono en tiempo real
  useEffect(() => {
    const rawPhone = clientPhone.replace(/\D/g, "");
    if (rawPhone.length >= 10) {
      const isRepeated = /^(\d)\1{9}$/.test(rawPhone);
      if (isRepeated) {
        setPhoneError("No uses el mismo número repetido.");
        return;
      }
      const phoneNumber = parsePhoneNumberFromString(rawPhone, 'MX');
      if (!phoneNumber || !phoneNumber.isValid()) {
        setPhoneError("El número ingresado no es un celular válido.");
        return;
      }
      setPhoneError("");
    } else {
      setPhoneError("");
    }
  }, [clientPhone]);

  const handleInitiateSend = () => {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={170}
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
        />

        <StatusModal
          isVisible={isStatusModalVisible}
          onClose={handleCloseStatusModal}
          title={statusModalContent.title}
          message={statusModalContent.message}
          isError={statusModalContent.isError}
        />

        <LoadingModal isVisible={isSubmitLoading} />

        <View style={styles.mainContainer}>
          <View style={styles.headerCard}>
            <Text style={styles.welcomeTitle}>
              Hola, <Text style={styles.welcomeUserName}>{salespersonName.split(" ")[0]}</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Completa el formulario para registrar un nuevo cliente.
            </Text>
          </View>

          <ClientForm
            clientNumber={clientNumber}
            clientName={clientName}
            clientPhone={clientPhone}
            phoneError={phoneError}
            onClientNumberChange={(text) => setClientNumber(text.replace(/[^0-9]/g, ""))}
            onClientNameChange={(text) => setClientName(text.replace(/[^a-zA-Z\s]/g, ""))}
            onClientPhoneChange={(text) => setClientPhone(formatClientPhone(text))}
            isLocationLoading={isLocationLoading}
            isSubmitLoading={isSubmitLoading}
            isStatusModalVisible={isStatusModalVisible}
            location={location}
            onGetLocation={() => setIsLocationModalVisible(true)}
            onInitiateSend={handleInitiateSend}
            isFormComplete={isFormComplete}
            isBasicInfoFilled={isBasicInfoFilled}
            contactMethod={contactMethod}
            onContactMethodChange={setContactMethod}
          />
        </View>

        {(contactMethod === "gps" || contactMethod === "both") && location && (
          <LocationMap location={location} mapRegion={mapRegion} />
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(20),
    paddingVertical: getResponsiveSize(30),
  },
  mainContainer: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
  },
  headerCard: {
    marginBottom: getResponsiveSize(4),
    alignContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: getResponsiveSize(20),
    color: "#1F2937",
  },
  welcomeUserName: {
    fontFamily: "Poppins_700Bold",
    fontSize: getResponsiveSize(20),
    color: "#3B82F6",
  },
  welcomeSubtitle: {
    fontFamily: "Roboto_400Regular",
    fontSize: getResponsiveSize(14),
    color: "#6B7280",
    lineHeight: getResponsiveSize(20),
    textAlign: "center",
  },
});
