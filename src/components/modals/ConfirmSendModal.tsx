import React from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { formatProperCase, getResponsiveSize } from "../../utils/helpers";

interface ConfirmSendModalProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  clientNumber?: string;
  clientName?: string;
  clientPhone?: string;
  placeCategory?: string;
  photoUri?: string | null;
  location?: { latitude: number; longitude: number } | null;
}

export const ConfirmSendModal: React.FC<ConfirmSendModalProps> = ({
  isVisible,
  onClose,
  onConfirm,
  clientNumber,
  clientName,
  clientPhone,
  placeCategory,
  photoUri,
  location,
}) => {
  const isLocationMode = Boolean(placeCategory);

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
              marginBottom: getResponsiveSize(8),
            }}
          >
            {isLocationMode ? "Confirmar Ubicación" : "Confirmar Envío"}
          </Text>
          <Text
            className="font-roboto text-gray-600 text-center"
            style={{
              fontSize: getResponsiveSize(13),
              lineHeight: getResponsiveSize(19),
              marginBottom: getResponsiveSize(18),
            }}
          >
            {isLocationMode
              ? "Se enviará el registro con las coordenadas de la tienda. ¿Deseas continuar?"
              : "Se enviará un correo con la siguiente información. ¿Deseas continuar?"}
          </Text>

          <View
            className="self-stretch bg-gray-50 border border-gray-200"
            style={{
              borderRadius: getResponsiveSize(10),
              padding: getResponsiveSize(14),
              marginBottom: getResponsiveSize(20),
            }}
          >
            {isLocationMode ? (
              <>
                <Text
                  className="font-roboto text-gray-700"
                  style={{
                    fontSize: getResponsiveSize(13),
                    marginBottom: getResponsiveSize(6),
                  }}
                >
                  • Establecimiento:{" "}
                  <Text className="font-roboto-medium text-gray-900">
                    {placeCategory}
                  </Text>
                </Text>
                {photoUri ? (
                  <View
                    className="flex-row items-center mb-2"
                  >
                    <Text
                      className="font-roboto text-gray-700 mr-2"
                      style={{ fontSize: getResponsiveSize(13) }}
                    >
                      • Foto fachada:
                    </Text>
                    <Image
                      source={{ uri: photoUri }}
                      style={{
                        width: getResponsiveSize(36),
                        height: getResponsiveSize(36),
                        borderRadius: getResponsiveSize(6),
                      }}
                      resizeMode="cover"
                    />
                    <Text
                      className="font-roboto-medium text-emerald-600 ml-1.5"
                      style={{ fontSize: getResponsiveSize(12) }}
                    >
                      Adjunta
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="font-roboto text-gray-500"
                    style={{
                      fontSize: getResponsiveSize(13),
                      marginBottom: getResponsiveSize(6),
                    }}
                  >
                    • Foto fachada:{" "}
                    <Text className="font-roboto text-gray-400">Sin foto</Text>
                  </Text>
                )}
              </>
            ) : (
              <>
                {clientNumber ? (
                  <Text
                    className="font-roboto text-gray-700"
                    style={{
                      fontSize: getResponsiveSize(14),
                      marginBottom: getResponsiveSize(8),
                    }}
                  >
                    • N° Cliente:{" "}
                    <Text className="font-roboto-medium text-gray-900">{clientNumber}</Text>
                  </Text>
                ) : null}
                {clientName ? (
                  <Text
                    className="font-roboto text-gray-700"
                    style={{
                      fontSize: getResponsiveSize(14),
                      marginBottom: getResponsiveSize(8),
                    }}
                  >
                    • Nombre:{" "}
                    <Text className="font-roboto-medium text-gray-900">
                      {formatProperCase(clientName)}
                    </Text>
                  </Text>
                ) : null}
                {clientPhone ? (
                  <Text
                    className="font-roboto text-gray-700"
                    style={{
                      fontSize: getResponsiveSize(14),
                      marginBottom: getResponsiveSize(8),
                    }}
                  >
                    • Teléfono:{" "}
                    <Text className="font-roboto-medium text-gray-900">{clientPhone}</Text>
                  </Text>
                ) : null}
              </>
            )}

            {location ? (
              <Text
                className="font-roboto text-gray-700"
                style={{ fontSize: getResponsiveSize(13) }}
              >
                • Ubicación GPS:{" "}
                <Text className="font-roboto-medium text-emerald-600">
                  Confirmada
                </Text>
              </Text>
            ) : null}
          </View>

          <View className="flex-row justify-between w-full">
            <TouchableOpacity
              className="flex-1 items-center justify-center bg-gray-100 border border-gray-300"
              style={{
                borderRadius: getResponsiveSize(12),
                paddingVertical: getResponsiveSize(12),
                marginHorizontal: getResponsiveSize(5),
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
                paddingVertical: getResponsiveSize(12),
                marginHorizontal: getResponsiveSize(5),
              }}
              onPress={onConfirm}
            >
              <Text
                className="font-roboto-medium text-white text-center"
                style={{ fontSize: getResponsiveSize(14) }}
              >
                Confirmar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
