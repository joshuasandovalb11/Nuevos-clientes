import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
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
            Confirmar Ubicación
          </Text>
          <Text
            className="font-roboto text-gray-600 text-center"
            style={{
              fontSize: getResponsiveSize(14),
              lineHeight: getResponsiveSize(22),
              marginBottom: getResponsiveSize(24),
            }}
          >
            Confirma que te encuentras físicamente en la tienda o local del cliente.
          </Text>
          <View className="flex-row justify-between w-full">
            <TouchableOpacity
              className="flex-1 items-center justify-center bg-gray-100 border border-gray-300"
              style={{
                borderRadius: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(14),
                marginHorizontal: getResponsiveSize(6),
              }}
              onPress={onClose}
            >
              <Text
                className="font-roboto-medium text-gray-600 text-center"
                style={{ fontSize: getResponsiveSize(14) }}
              >
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 items-center justify-center bg-blue-500"
              style={{
                borderRadius: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(14),
                marginHorizontal: getResponsiveSize(6),
              }}
              onPress={onConfirm}
            >
              <Text
                className="font-roboto-medium text-white text-center"
                style={{ fontSize: getResponsiveSize(14) }}
              >
                Sí, Obtener
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
