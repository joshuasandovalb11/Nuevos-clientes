import React from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import { styles as sharedStyles } from "./LocationModal"; // Reusing styles

interface StatusModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  isError: boolean;
}

export const StatusModal: React.FC<StatusModalProps> = ({
  isVisible,
  onClose,
  title,
  message,
  isError,
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
          <Text style={sharedStyles.modalTitle}>{title}</Text>
          <Text style={sharedStyles.modalText}>{message}</Text>
          <TouchableOpacity
            style={[
              sharedStyles.modalButton,
              isError ? styles.modalButtonError : sharedStyles.modalButtonConfirm,
              { flex: 0, width: "100%" },
            ]}
            onPress={onClose}
          >
            <Text style={sharedStyles.modalButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalButtonError: { backgroundColor: "#EF4444" },
});
