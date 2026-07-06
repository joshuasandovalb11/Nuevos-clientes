import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getResponsiveSize } from "../../utils/helpers";

interface LocationModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Confirmar Ubicación</Text>
          <Text style={styles.modalText}>
            Confirma que te encuentras físicamente en la tienda o local del cliente.
          </Text>
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonCancel]}
              onPress={onClose}
            >
              <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonConfirm]}
              onPress={onConfirm}
            >
              <Text style={styles.modalButtonText}>Sí, Obtener</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const styles = StyleSheet.create({
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
    fontFamily: "Poppins_700Bold",
    fontSize: getResponsiveSize(18),
    color: "#1F2937",
    textAlign: "center",
    marginBottom: getResponsiveSize(12),
  },
  modalText: {
    fontFamily: "Roboto_400Regular",
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
  modalButtonText: {
    fontFamily: "Roboto_500Medium",
    fontSize: getResponsiveSize(14),
    color: "#FFFFFF",
    textAlign: "center",
  },
  modalButtonTextCancel: { color: "#4B5563" },
});
