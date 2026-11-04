import React from "react";
import { View, Text, Modal, ActivityIndicator } from "react-native";
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
      <View className="flex-1 bg-black/40 justify-center items-center">
        <View
          className="bg-white items-center shadow-lg"
          style={{
            borderRadius: getResponsiveSize(16),
            padding: getResponsiveSize(32),
            elevation: 4,
          }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text
            className="font-roboto-medium text-gray-600 text-center"
            style={{
              fontSize: getResponsiveSize(14),
              marginTop: getResponsiveSize(16),
            }}
          >
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
};
