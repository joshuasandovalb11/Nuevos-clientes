import * as Location from "expo-location";
import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { ClientForm } from "../src/components/form/ClientForm";
import { LocationMap } from "../src/components/map/LocationMap";
import { ConfirmSendModal } from "../src/components/modals/ConfirmSendModal";
import { LoadingModal } from "../src/components/modals/LoadingModal";
import { LocationModal } from "../src/components/modals/LocationModal";
import { StatusModal } from "../src/components/modals/StatusModal";

import { registerClient } from "../src/services/api";
import { formatClientPhone, formatProperCase, getResponsiveSize } from "../src/utils/helpers";

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
  const [statusModalContent, setStatusModalContent] = useState({
    title: "",
    message: "",
    isError: false,
  });

  // --- Lógica de Salida ---
  const handleLogout = () => {
    Alert.alert(
      "Confirmar Salida",
      "¿Estás seguro de que quieres salir? Se limpiarán todos los datos no guardados.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          onPress: () => {
            router.replace("/");
          },
          style: "destructive",
        },
      ]
    );
  };

  // --- Lógica de Ubicación ---
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permiso denegado",
          "Se necesita permiso de ubicación para usar esta función."
        );
      }
    })();
  }, []);

  const handleConfirmAndGetLocation = async () => {
    setIsLocationModalVisible(false);
    setIsLocationLoading(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
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

    if (contactMethod === "phone" && !hasPhone) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, ingresa el teléfono del cliente.",
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }

    if (contactMethod === "gps" && !hasLocation) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, confirma la ubicación.",
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }

    if (contactMethod === "both" && (!hasPhone || !hasLocation)) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, proporciona el teléfono y la ubicación.",
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

  let isContactComplete = false;
  if (contactMethod === "phone") isContactComplete = hasPhone;
  else if (contactMethod === "gps") isContactComplete = hasLocation;
  else if (contactMethod === "both") isContactComplete = hasPhone && hasLocation;

  const isFormComplete = isBasicInfoFilled && isContactComplete;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Salir</Text>
            </TouchableOpacity>
          ),
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
    </>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
  },
  logoutButtonText: {
    color: "#EF4444",
    fontFamily: "Roboto_500Medium",
    fontSize: getResponsiveSize(14),
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: getResponsiveSize(20),
    paddingTop: getResponsiveSize(4),
    paddingBottom: getResponsiveSize(40),
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
