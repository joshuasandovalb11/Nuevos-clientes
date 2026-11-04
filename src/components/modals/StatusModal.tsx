import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { getResponsiveSize } from "../../utils/helpers";

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
      <View
        className="flex-1 bg-black/60 justify-center items-center"
        style={{ padding: getResponsiveSize(20) }}
      >
        <View
          className="bg-white w-full max-w-[380px] items-center shadow-xl"
          style={{
            borderRadius: getResponsiveSize(16),
            padding: getResponsiveSize(24),
            elevation: 10,
          }}
        >
          <Text
            className="font-poppins-bold text-gray-800 text-center"
            style={{
              fontSize: getResponsiveSize(18),
              marginBottom: getResponsiveSize(12),
            }}
          >
            {title}
          </Text>
          <Text
            className="font-roboto text-gray-600 text-center"
            style={{
              fontSize: getResponsiveSize(14),
              lineHeight: getResponsiveSize(22),
              marginBottom: getResponsiveSize(24),
            }}
          >
            {message}
          </Text>
          <TouchableOpacity
            className={`w-full items-center justify-center ${
              isError ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{
              borderRadius: getResponsiveSize(12),
              paddingVertical: getResponsiveSize(14),
            }}
            onPress={onClose}
          >
            <Text
              className="font-roboto-medium text-white text-center"
              style={{ fontSize: getResponsiveSize(14) }}
            >
              Aceptar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
