import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  formatPhoneNumber,
  getResponsiveHeight,
  getResponsiveSize,
} from "../../utils/helpers";

interface AuthScreenProps {
  userPhoneNumber: string;
  onPhoneNumberChange: (text: string) => void;
  onVerify: () => void;
  isLoading: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  userPhoneNumber,
  onPhoneNumberChange,
  onVerify,
  isLoading,
}) => {
  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: "#F8FAFC" }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
    // extraScrollHeight={20}
    >
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Verificación de Vendedor</Text>
          <Text style={styles.authSubtitle}>
            Ingresa tu número de teléfono para registrar clientes.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Tu número de teléfono (10 dígitos)"
            value={formatPhoneNumber(userPhoneNumber)}
            onChangeText={onPhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={12}
            placeholderTextColor="#9CA3AF"
          />
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#3B82F6"
              style={{ marginTop: 20 }}
            />
          ) : (
            <TouchableOpacity style={styles.authButton} onPress={onVerify}>
              <Text style={styles.authButtonText}>Verificar y Continuar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  authContainer: {
    padding: 20,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
  },
  authCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    alignItems: "center",
  },
  authTitle: {
    fontFamily: "Poppins_700Bold",
    fontSize: getResponsiveSize(16),
    color: "#1F2937",
    marginBottom: 8,
  },
  authSubtitle: {
    fontFamily: "Roboto_400Regular",
    fontSize: getResponsiveSize(12),
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F9FAFB",
    height: getResponsiveHeight(50),
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: getResponsiveSize(12),
    paddingHorizontal: getResponsiveSize(12),
    fontSize: getResponsiveSize(14),
    fontFamily: "Roboto_400Regular",
    color: "#111827",
    width: "100%",
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
  authButtonText: {
    fontFamily: "Roboto_500Medium",
    color: "#FFFFFF",
    fontSize: 16,
  },
});
