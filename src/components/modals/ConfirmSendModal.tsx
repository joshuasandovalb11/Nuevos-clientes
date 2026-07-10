import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatProperCase, getResponsiveSize } from "../../utils/helpers";
import { styles as sharedStyles } from "./LocationModal"; // Reusing styles

interface ConfirmSendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientNumber: string;
  clientName: string;
  clientPhone: string;
}

export const ConfirmSendModal: React.FC<ConfirmSendModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  clientNumber,
  clientName,
  clientPhone,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={sharedStyles.modalOverlay}>
        <View style={sharedStyles.modalContainer}>
          <Text style={sharedStyles.modalTitle}>Confirmar Envío</Text>
          <Text style={sharedStyles.modalText}>
            Se enviará un correo con la siguiente información. ¿Deseas continuar?
          </Text>
          <View style={styles.dataConfirmContainer}>
            <Text style={styles.dataConfirmText}>
              • N° Cliente: <Text style={styles.dataBold}>{clientNumber}</Text>
            </Text>
            <Text style={styles.dataConfirmText}>
              • Nombre:{" "}
              <Text style={styles.dataBold}>{formatProperCase(clientName)}</Text>
            </Text>
            <Text style={styles.dataConfirmText}>
              • Teléfono:{" "}
              <Text style={styles.dataBold}>{clientPhone}</Text>
            </Text>
          </View>
          <View style={sharedStyles.modalButtonContainer}>
            <TouchableOpacity
              style={[sharedStyles.modalButton, sharedStyles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text
                style={[
                  sharedStyles.modalButtonText,
                  sharedStyles.modalButtonTextCancel,
                ]}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[sharedStyles.modalButton, sharedStyles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text style={sharedStyles.modalButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    fontFamily: "Roboto_400Regular",
    fontSize: getResponsiveSize(14),
    color: "#374151",
    marginBottom: getResponsiveSize(8),
  },
  dataBold: { fontFamily: "Roboto_500Medium", color: "#111827" },
});
