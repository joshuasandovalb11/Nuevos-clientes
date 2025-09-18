/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Location from "expo-location";
import { useNavigation } from "expo-router";
import { useEffect, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

const { width, height } = Dimensions.get("window");

// --- Funciones de Responsividad ---
const getResponsiveSize = (baseSize: number) => {
  const scale = width / 375;
  const newSize = baseSize * scale;
  return Math.max(newSize, baseSize * 0.8);
};
const getResponsiveHeight = (baseHeight: number) => {
  const scale = height / 812;
  return Math.max(baseHeight * scale, baseHeight * 0.7);
};

// --- Componente Principal ---
export default function HomeScreen() {
  // --- Estados ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [authIsLoading, setAuthIsLoading] = useState(false);

  const [salespersonInfo, setSalespersonInfo] = useState<{
    name: string;
    phone: string;
  } | null>(null);

  const [clientNumber, setClientNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [mapRegion, setMapRegion] = useState({
    latitude: 32.5333,
    longitude: -117.0167,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isConfirmSendModalVisible, setIsConfirmSendModalVisible] =
    useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [statusModalContent, setStatusModalContent] = useState({
    title: "",
    message: "",
    isError: false,
  });

  const navigation = useNavigation();

  // --- Lógica de Autenticación y Navegación ---
  const handleLogout = () => {
    Alert.alert(
      "Confirmar Salida",
      "¿Estás seguro de que quieres salir? Se limpiarán todos los datos del formulario.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          onPress: () => {
            setIsAuthenticated(false);
            setUserPhoneNumber("");
            setClientName("");
            setClientNumber("");
            setLocation(null);
            setSalespersonInfo(null);
          },
          style: "destructive",
        },
      ]
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        isAuthenticated ? (
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutButtonText}>Salir</Text>
          </TouchableOpacity>
        ) : null,
    });
  }, [navigation, isAuthenticated]);

  const handleVerifyUser = async () => {
    if (!userPhoneNumber || userPhoneNumber.length !== 10) {
      Alert.alert(
        "Número Inválido",
        "Por favor, ingresa tu número de teléfono a 10 dígitos."
      );
      return;
    }
    setAuthIsLoading(true);
    try {
      const response = await fetch(
        "https://backend-email-murex.vercel.app/api/verify-user",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_phone_number: userPhoneNumber }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        setSalespersonInfo(result.user);
      } else {
        Alert.alert(
          "Acceso Denegado",
          result.error || "Este número no tiene permiso."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error de Conexión",
        "No se pudo verificar el usuario. Revisa tu conexión."
      );
    } finally {
      setAuthIsLoading(false);
    }
  };

  // --- Lógica del Formulario ---
  const formatPhoneNumber = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, "");
    if (numericValue.length <= 3) return numericValue;
    if (numericValue.length <= 6)
      return `${numericValue.slice(0, 3)}-${numericValue.slice(3)}`;
    return `${numericValue.slice(0, 3)}-${numericValue.slice(
      3,
      6
    )}-${numericValue.slice(6, 10)}`;
  };

  const handleUserPhoneNumberChange = (text: string) => {
    setUserPhoneNumber(text.replace(/[^0-9]/g, ""));
  };

  const handleClientNumberChange = (text: string) => {
    setClientNumber(text.replace(/[^0-9]/g, ""));
  };

  const handleClientNameChange = (text: string) => {
    setClientName(text.replace(/[^a-zA-Z\s]/g, ""));
  };

  const formatProperCase = (name: string | undefined) => {
    if (!name) {
      return "";
    }
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

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

  const handleGetLocation = () => setIsLocationModalVisible(true);

  const handleConfirmAndGetLocation = async () => {
    setIsLocationModalVisible(false);
    setIsLoading(true);
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
    } catch (error) {
      setStatusModalContent({
        title: "Error de Ubicación",
        message:
          "No se pudo obtener la ubicación. Asegúrate de que tu GPS esté activado.",
        isError: true,
      });
      setIsStatusModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateSend = () => {
    if (!isFormComplete) {
      setStatusModalContent({
        title: "Datos incompletos",
        message: "Por favor, completa todos los campos y obtén la ubicación.",
        isError: true,
      });
      setIsStatusModalVisible(true);
      return;
    }
    setIsConfirmSendModalVisible(true);
  };

  const executeSendEmail = async () => {
    setIsConfirmSendModalVisible(false);
    setIsLoading(true);
    if (!location || !salespersonInfo) return;

    const payload = {
      client_number: clientNumber.trim(),
      client_name: formatProperCase(clientName.trim()),
      latitude: location.latitude,
      longitude: location.longitude,
      salesperson_name: salespersonInfo.name,
      salesperson_phone: salespersonInfo.phone,
    };
    try {
      const response = await fetch(
        "https://backend-email-murex.vercel.app/api/send-mail",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Ocurrió un error en el servidor.");
      setStatusModalContent({
        title: "✅ ¡Éxito!",
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
      setIsLoading(false);
    }
  };

  const handleCloseStatusModal = () => {
    setIsStatusModalVisible(false);
    if (!statusModalContent.isError) {
      setClientName("");
      setClientNumber("");
      setLocation(null);
    }
  };

  const areClientDetailsFilled =
    clientNumber.trim() !== "" && clientName.trim() !== "";
  const isFormComplete = areClientDetailsFilled && location !== null;

  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Verificación de Vendedor</Text>
          <Text style={styles.authSubtitle}>
            Ingresa tu número de teléfono para registrar clientes.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Tu número de teléfono (10 dígitos)"
            value={formatPhoneNumber(userPhoneNumber)}
            onChangeText={handleUserPhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={12}
            placeholderTextColor="#9CA3AF"
          />
          {authIsLoading ? (
            <ActivityIndicator
              size="large"
              color="#3B82F6"
              style={{ marginTop: 20 }}
            />
          ) : (
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleVerifyUser}
            >
              <Text style={styles.authButtonText}>Verificar y Continuar</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLocationModalVisible}
          onRequestClose={() => setIsLocationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>📍 Confirmar Ubicación</Text>
              <Text style={styles.modalText}>
                Confirma que te encuentras físicamente en la tienda o local del
                cliente.
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setIsLocationModalVisible(false)}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.modalButtonTextCancel,
                    ]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleConfirmAndGetLocation}
                >
                  <Text style={styles.modalButtonText}>Sí, Obtener</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={isConfirmSendModalVisible}
          onRequestClose={() => setIsConfirmSendModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>✉️ Confirmar Envío</Text>
              <Text style={styles.modalText}>
                Se enviará un correo con la siguiente información. ¿Deseas
                continuar?
              </Text>
              <View style={styles.dataConfirmContainer}>
                <Text style={styles.dataConfirmText}>
                  • N° Cliente:{" "}
                  <Text style={styles.dataBold}>{clientNumber}</Text>
                </Text>
                <Text style={styles.dataConfirmText}>
                  • Nombre:{" "}
                  <Text style={styles.dataBold}>
                    {formatProperCase(clientName)}
                  </Text>
                </Text>
              </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setIsConfirmSendModalVisible(false)}
                >
                  <Text
                    style={[
                      styles.modalButtonText,
                      styles.modalButtonTextCancel,
                    ]}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={executeSendEmail}
                >
                  <Text style={styles.modalButtonText}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          animationType="fade"
          transparent={true}
          visible={isStatusModalVisible}
          onRequestClose={handleCloseStatusModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{statusModalContent.title}</Text>
              <Text style={styles.modalText}>{statusModalContent.message}</Text>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  statusModalContent.isError
                    ? styles.modalButtonError
                    : styles.modalButtonConfirm,
                  { flex: 0, width: "100%" },
                ]}
                onPress={handleCloseStatusModal}
              >
                <Text style={styles.modalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={styles.mainContainer}>
          <View
            style={[styles.headerCard, { marginBottom: getResponsiveSize(12) }]}
          >
            <Text style={styles.welcomeTitle}>
              Hola, {formatProperCase(salespersonInfo?.name) || "Vendedor"}
            </Text>
            <Text style={styles.subtitle}>
              Completa la información del nuevo cliente
            </Text>
          </View>

          <View
            style={[styles.formCard, { marginBottom: getResponsiveSize(12) }]}
          >
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número de Cliente</Text>
              <TextInput
                style={[styles.input, clientNumber && styles.inputFilled]}
                placeholder="Ej: 001234"
                value={clientNumber}
                onChangeText={handleClientNumberChange}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nombre del Cliente</Text>
              <TextInput
                style={[styles.input, clientName && styles.inputFilled]}
                placeholder="Nombre completo del cliente"
                value={clientName}
                onChangeText={handleClientNameChange}
                keyboardType="default"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.locationSection}>
              <Text style={styles.inputLabel}>Ubicación del Cliente</Text>
              {isLoading && !isStatusModalVisible ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>
                    Obteniendo coordenadas...
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.locationButton,
                    !areClientDetailsFilled && styles.locationButtonDisabled,
                  ]}
                  onPress={handleGetLocation}
                  disabled={!areClientDetailsFilled}
                >
                  <Text style={styles.locationButtonText}>
                    {location ? "Ubicación Confirmada ✓" : "Obtener Ubicación"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                isFormComplete && styles.submitButtonActive,
              ]}
              onPress={handleInitiateSend}
              disabled={!isFormComplete || isLoading}
            >
              <Text
                style={[
                  styles.submitButtonText,
                  isFormComplete && styles.submitButtonTextActive,
                ]}
              >
                {isLoading
                  ? "Enviando..."
                  : isFormComplete
                  ? "Enviar Registro"
                  : "⚠️ Completa todos los campos"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {location && (
          <View style={styles.mapContainer}>
            <View style={styles.mapCard}>
              <Text style={styles.mapTitle}>🗺️ Ubicación en el Mapa</Text>
              <Text style={styles.mapSubtitle}>
                Esta es la ubicación exacta que fue registrada.
              </Text>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
              >
                <Marker
                  coordinate={location}
                  title="Ubicación del Cliente"
                  description="Ubicación confirmada"
                />
              </MapView>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Hoja de Estilos ---
const styles = StyleSheet.create({
  keyboardAvoidingContainer: { flex: 1 },
  scrollContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { flexGrow: 1, paddingBottom: 50 },
  mainContainer: { padding: getResponsiveSize(16) },

  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(20),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
  },
  welcomeTitle: {
    fontSize: getResponsiveSize(20),
    fontWeight: "bold",
    color: "#111827",
    marginBottom: getResponsiveSize(4),
    textAlign: "center",
  },
  subtitle: {
    fontSize: getResponsiveSize(14),
    color: "#6B7280",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: "100%",
  },
  inputContainer: { marginBottom: getResponsiveSize(16) },
  inputLabel: {
    fontSize: getResponsiveSize(14),
    fontWeight: "600",
    color: "#374151",
    marginBottom: getResponsiveSize(6),
  },
  input: {
    backgroundColor: "#F9FAFB",
    height: getResponsiveHeight(50),
    borderColor: "#D1D5DB",
    borderWidth: 2,
    borderRadius: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(12),
    fontSize: getResponsiveSize(16),
    color: "#111827",
  },
  inputFilled: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },

  locationSection: { marginTop: getResponsiveSize(4) },
  locationButton: {
    backgroundColor: "#3B82F6",
    borderRadius: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(16),
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  locationButtonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  locationButtonText: {
    color: "#FFFFFF",
    fontSize: getResponsiveSize(16),
    fontWeight: "600",
  },
  submitButtonContainer: {
    marginTop: getResponsiveSize(20),
    width: "100%",
    alignItems: "center",
  },
  submitButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(18),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: "center",
    width: "100%",
  },
  submitButtonActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: getResponsiveSize(16),
    fontWeight: "600",
    color: "#9CA3AF",
  },
  submitButtonTextActive: { color: "#FFFFFF" },
  logoutButton: { marginRight: 15 },
  logoutButtonText: { color: "#EF4444", fontSize: 16, fontWeight: "700" },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: getResponsiveSize(16),
  },
  loadingText: {
    marginTop: getResponsiveSize(8),
    fontSize: getResponsiveSize(16),
    color: "#6B7280",
  },

  mapContainer: {
    paddingHorizontal: getResponsiveSize(16),
    marginTop: getResponsiveSize(8),
    marginBottom: 30,
  },
  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapTitle: {
    fontSize: getResponsiveSize(16),
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: getResponsiveSize(2),
  },
  mapSubtitle: {
    fontSize: getResponsiveSize(14),
    color: "#6B7280",
    marginBottom: getResponsiveSize(12),
  },
  map: {
    width: "100%",
    height: getResponsiveHeight(250),
    borderRadius: getResponsiveSize(12),
    overflow: "hidden",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: getResponsiveSize(20),
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(24),
    width: "100%",
    maxWidth: 380,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: getResponsiveSize(18),
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: getResponsiveSize(12),
  },
  modalText: {
    fontSize: getResponsiveSize(14),
    color: "#4B5563",
    textAlign: "center",
    lineHeight: getResponsiveSize(22),
    marginBottom: getResponsiveSize(24),
  },
  modalButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    borderRadius: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(14),
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: getResponsiveSize(6),
  },
  modalButtonCancel: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  modalButtonConfirm: { backgroundColor: "#3B82F6" },
  modalButtonError: { backgroundColor: "#EF4444" },
  modalButtonText: {
    fontSize: getResponsiveSize(14),
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  modalButtonTextCancel: { color: "#4B5563" },
  dataConfirmContainer: {
    alignSelf: "stretch",
    backgroundColor: "#F9FAFB",
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: getResponsiveSize(16),
    marginBottom: getResponsiveSize(24),
  },
  dataConfirmText: {
    fontSize: getResponsiveSize(14),
    color: "#374151",
    marginBottom: getResponsiveSize(8),
  },
  dataBold: { fontWeight: "600", color: "#111827" },

  authContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  authCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: "center",
    marginBottom: 100,
  },
  authTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  authButton: {
    marginTop: 20,
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  authButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
});
