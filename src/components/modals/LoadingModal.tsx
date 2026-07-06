import React from "react";
import { View, Text, Modal, StyleSheet, ActivityIndicator } from "react-native";
import { getResponsiveSize } from "../../utils/helpers";

interface LoadingModalProps {
  isVisible: boolean;
  message?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({
  isVisible,
  message = "Enviando registro...",
}) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.modalText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(32),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  modalText: {
    fontFamily: "Roboto_500Medium",
    fontSize: getResponsiveSize(14),
    color: "#4B5563",
    marginTop: getResponsiveSize(16),
    textAlign: "center",
  },
});
