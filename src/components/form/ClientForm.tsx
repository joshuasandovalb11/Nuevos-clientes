import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getResponsiveHeight, getResponsiveSize } from "../../utils/helpers";

interface ClientFormProps {
  clientNumber: string;
  clientName: string;
  clientPhone: string;
  onClientNumberChange: (text: string) => void;
  onClientNameChange: (text: string) => void;
  onClientPhoneChange: (text: string) => void;
  isLocationLoading: boolean;
  isSubmitLoading: boolean;
  isStatusModalVisible: boolean;
  location: any;
  onGetLocation: () => void;
  onInitiateSend: () => void;
  isFormComplete: boolean;
  isBasicInfoFilled: boolean;
  contactMethod: "phone" | "gps" | "both";
  onContactMethodChange: (method: "phone" | "gps" | "both") => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  clientNumber,
  clientName,
  clientPhone,
  onClientNumberChange,
  onClientNameChange,
  onClientPhoneChange,
  isLocationLoading,
  isSubmitLoading,
  isStatusModalVisible,
  location,
  onGetLocation,
  onInitiateSend,
  isFormComplete,
  isBasicInfoFilled,
  contactMethod,
  onContactMethodChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Obligatoria</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Número de cliente</Text>
          <View style={[styles.inputWrapper, clientNumber ? styles.inputWrapperFilled : null]}>
            <View style={[styles.iconBox, clientNumber ? styles.iconBoxFilled : null]}>
              <Feather name="hash" size={18} color={clientNumber ? "#3B82F6" : "#9CA3AF"} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Ej: 3245"
              value={clientNumber}
              onChangeText={onClientNumberChange}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Nombre del cliente</Text>
          <View style={[styles.inputWrapper, clientName ? styles.inputWrapperFilled : null]}>
            <View style={[styles.iconBox, clientName ? styles.iconBoxFilled : null]}>
              <Feather name="user" size={18} color={clientName ? "#3B82F6" : "#9CA3AF"} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nombre completo del cliente"
              value={clientName}
              onChangeText={onClientNameChange}
              keyboardType="default"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        <View style={styles.sectionHeaderDivider}>
          <Text style={styles.sectionTitle}>Información adicional</Text>
          <Text style={styles.sectionTitleSub}>Selecciona una opción para completar la informacion del cliente</Text>
        </View>

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentButton, contactMethod === "phone" && styles.segmentButtonActive]}
            onPress={() => onContactMethodChange("phone")}
          >
            <Text style={[styles.segmentButtonText, contactMethod === "phone" && styles.segmentButtonTextActive]}>Teléfono</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, contactMethod === "gps" && styles.segmentButtonActive]}
            onPress={() => onContactMethodChange("gps")}
          >
            <Text style={[styles.segmentButtonText, contactMethod === "gps" && styles.segmentButtonTextActive]}>GPS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentButton, contactMethod === "both" && styles.segmentButtonActive]}
            onPress={() => onContactMethodChange("both")}
          >
            <Text style={[styles.segmentButtonText, contactMethod === "both" && styles.segmentButtonTextActive]}>Ambos</Text>
          </TouchableOpacity>
        </View>

        {(contactMethod === "phone" || contactMethod === "both") && (
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono celular del propietario del negocio</Text>
            <View style={[styles.inputWrapper, clientPhone ? styles.inputWrapperFilled : null]}>
              <View style={[styles.iconBox, clientPhone ? styles.iconBoxFilled : null]}>
                <Feather name="phone" size={18} color={clientPhone ? "#3B82F6" : "#9CA3AF"} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Ej: (664)-123-4567"
                value={clientPhone}
                onChangeText={onClientPhoneChange}
                keyboardType="phone-pad"
                maxLength={14}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>
        )}

        {(contactMethod === "gps" || contactMethod === "both") && (
          <View style={styles.locationSection}>
            <Text style={styles.inputLabel}>Ubicación del negocio</Text>
            {isLocationLoading && !isStatusModalVisible ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Obteniendo coordenadas...</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.locationButton,
                  !isBasicInfoFilled && styles.locationButtonDisabled,
                ]}
                onPress={onGetLocation}
                disabled={!isBasicInfoFilled}
              >
                <Text style={styles.locationButtonText}>
                  {location ? (
                    <>
                      <Feather name="refresh-cw" size={14} />
                      {" Volver a obtener ubicación"}
                    </>
                  ) : (
                    "Obtener ubicación"
                  )}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.submitButtonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            isFormComplete && styles.submitButtonActive,
          ]}
          onPress={onInitiateSend}
          disabled={!isFormComplete || isSubmitLoading}
        >
          <Text
            style={[
              styles.submitButtonText,
              isFormComplete && styles.submitButtonTextActive,
            ]}
          >
            {isSubmitLoading
              ? "Enviando..."
              : "Enviar Registro"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  formCard: {
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(20),
    width: "100%",
    marginBottom: getResponsiveSize(10),
  },
  sectionHeader: {
    marginBottom: getResponsiveSize(8),
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    elevation: 1,
    borderRadius: getResponsiveSize(8),
    padding: getResponsiveSize(4),
    marginBottom: getResponsiveSize(20),
  },
  segmentButton: {
    flex: 1,
    paddingVertical: getResponsiveSize(8),
    alignItems: "center",
    borderRadius: getResponsiveSize(6),
  },
  segmentButtonActive: {
    backgroundColor: "#3B82F6",
    elevation: 1,
  },
  segmentButtonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: getResponsiveSize(13),
    color: "#6B7280",
  },
  segmentButtonTextActive: {
    color: "#ffffffff",
  },
  sectionHeaderDivider: {
    marginTop: getResponsiveSize(8),
    marginBottom: getResponsiveSize(16),
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: getResponsiveSize(16),
  },
  sectionTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: getResponsiveSize(14),
    color: "#4B5563",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitleSub: {
    fontFamily: "Roboto_400Regular",
    fontSize: getResponsiveSize(12),
    color: "#6B7280",
  },
  inputContainer: { marginBottom: getResponsiveSize(14) },
  inputLabel: {
    fontFamily: "Roboto_400Regular",
    fontSize: getResponsiveSize(13),
    color: "#374151",
    marginBottom: getResponsiveSize(6),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: getResponsiveSize(12),
    overflow: "hidden",
  },
  inputWrapperFilled: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
  },
  iconBox: {
    width: getResponsiveHeight(45),
    height: getResponsiveHeight(45),
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#D1D5DB",
  },
  iconBoxFilled: {
    backgroundColor: "#DBEAFE",
    borderRightColor: "#3B82F6",
  },
  input: {
    flex: 1,
    height: getResponsiveHeight(45),
    paddingHorizontal: getResponsiveSize(12),
    fontSize: getResponsiveSize(14),
    fontFamily: "Roboto_400Regular",
    color: "#111827",
    backgroundColor: "transparent",
  },
  locationSection: { marginTop: getResponsiveSize(0) },
  locationButton: {
    backgroundColor: "#3B82F6",
    height: getResponsiveHeight(45),
    borderRadius: getResponsiveSize(12),
    alignItems: "center",
    justifyContent: "center",
  },
  locationButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  locationButtonText: {
    fontFamily: "Roboto_500Medium",
    color: "#FFFFFF",
    fontSize: getResponsiveSize(14),
  },
  submitButtonContainer: {
    width: "auto",
    alignSelf: "center",
  },
  submitButton: {
    backgroundColor: "#E5E7EB",
    borderRadius: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: "center",
    width: "100%",
  },
  submitButtonActive: {
    backgroundColor: "#10B981",
  },
  submitButtonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: getResponsiveSize(14),
    color: "#9CA3AF",
  },
  submitButtonTextActive: { color: "#FFFFFF" },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: getResponsiveSize(16),
  },
  loadingText: {
    fontFamily: "Roboto_400Regular",
    marginTop: getResponsiveSize(8),
    fontSize: getResponsiveSize(12),
    color: "#6B7280",
  },
});
