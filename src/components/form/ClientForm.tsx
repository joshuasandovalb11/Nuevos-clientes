// src/components/form/ClientForm.tsx
import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Region } from "react-native-maps";
import { getResponsiveHeight, getResponsiveSize } from "../../utils/helpers";
import { LocationMap } from "../map/LocationMap";
import { MediaCardSkeleton } from "../ui/Skeleton";

interface ClientFormProps {
  clientNumber: string;
  clientName: string;
  clientPhone: string;
  onClientNumberChange: (text: string) => void;
  onClientNameChange: (text: string) => void;
  onClientPhoneChange: (text: string) => void;
  phoneError?: string;
  isLocationLoading: boolean;
  isStatusModalVisible: boolean;
  location: { latitude: number; longitude: number } | null;
  mapRegion?: Region;
  onLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  onGetLocation: () => void;
  isBasicInfoFilled: boolean;
  contactMethod: "phone" | "gps" | "both";
  onContactMethodChange: (method: "phone" | "gps" | "both") => void;
  onInputFocus?: (field: "number" | "name" | "phone") => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  clientNumber,
  clientName,
  clientPhone,
  onClientNumberChange,
  onClientNameChange,
  onClientPhoneChange,
  phoneError,
  isLocationLoading,
  isStatusModalVisible,
  location,
  mapRegion,
  onLocationChange,
  onGetLocation,
  isBasicInfoFilled,
  contactMethod,
  onContactMethodChange,
  onInputFocus,
}) => {
  return (
    <View className="w-full">
      <View
        className="w-full bg-white border border-gray-200"
        style={{
          borderRadius: getResponsiveSize(16),
          padding: getResponsiveSize(18),
          marginBottom: getResponsiveSize(16),
        }}
      >
        <View style={{ marginBottom: getResponsiveSize(8) }}>
          <Text
            className="font-poppins-bold text-gray-700 uppercase tracking-wider"
            style={{ fontSize: getResponsiveSize(13) }}
          >
            Información Obligatoria
          </Text>
        </View>

        <View style={{ marginBottom: getResponsiveSize(14) }}>
          <Text
            className="font-roboto text-gray-700"
            style={{
              fontSize: getResponsiveSize(13),
              marginBottom: getResponsiveSize(6),
            }}
          >
            Número de cliente
          </Text>
          <View
            className={`flex-row items-center border overflow-hidden ${
              clientNumber
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
            style={{ borderRadius: getResponsiveSize(12) }}
          >
            <View
              className={`justify-center items-center border-r ${
                clientNumber
                  ? "bg-blue-100 border-r-blue-500"
                  : "border-r-gray-300"
              }`}
              style={{
                width: getResponsiveHeight(45),
                height: getResponsiveHeight(45),
              }}
            >
              <Feather name="hash" size={18} color={clientNumber ? "#3B82F6" : "#9CA3AF"} />
            </View>
            <TextInput
              className="flex-1 font-roboto text-gray-900 bg-transparent"
              style={{
                height: getResponsiveHeight(45),
                paddingHorizontal: getResponsiveSize(12),
                fontSize: getResponsiveSize(14),
              }}
              placeholder="Ej: 3245"
              value={clientNumber}
              onChangeText={onClientNumberChange}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              contextMenuHidden={true}
              onFocus={() => onInputFocus?.("number")}
            />
          </View>
        </View>

        <View style={{ marginBottom: getResponsiveSize(14) }}>
          <Text
            className="font-roboto text-gray-700"
            style={{
              fontSize: getResponsiveSize(13),
              marginBottom: getResponsiveSize(6),
            }}
          >
            Nombre del cliente
          </Text>
          <View
            className={`flex-row items-center border overflow-hidden ${
              clientName
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
            style={{ borderRadius: getResponsiveSize(12) }}
          >
            <View
              className={`justify-center items-center border-r ${
                clientName
                  ? "bg-blue-100 border-r-blue-500"
                  : "border-r-gray-300"
              }`}
              style={{
                width: getResponsiveHeight(45),
                height: getResponsiveHeight(45),
              }}
            >
              <Feather name="user" size={18} color={clientName ? "#3B82F6" : "#9CA3AF"} />
            </View>
            <TextInput
              className="flex-1 font-roboto text-gray-900 bg-transparent"
              style={{
                height: getResponsiveHeight(45),
                paddingHorizontal: getResponsiveSize(12),
                fontSize: getResponsiveSize(14),
              }}
              placeholder="Nombre completo del cliente"
              value={clientName}
              onChangeText={onClientNameChange}
              keyboardType="default"
              placeholderTextColor="#9CA3AF"
              contextMenuHidden={true}
              onFocus={() => onInputFocus?.("name")}
            />
          </View>
        </View>

        <View
          className="border-t border-gray-200"
          style={{
            marginTop: getResponsiveSize(8),
            marginBottom: getResponsiveSize(16),
            paddingTop: getResponsiveSize(16),
          }}
        >
          <Text
            className="font-poppins-bold text-gray-700 uppercase tracking-wider"
            style={{ fontSize: getResponsiveSize(13) }}
          >
            Información adicional
          </Text>
          <Text
            className="font-roboto text-gray-500"
            style={{ fontSize: getResponsiveSize(12) }}
          >
            Selecciona una opción para completar la información del cliente
          </Text>
        </View>

        <View
          className="flex-row bg-gray-100"
          style={{
            elevation: 1,
            borderRadius: getResponsiveSize(8),
            padding: getResponsiveSize(4),
            marginBottom: getResponsiveSize(20),
          }}
        >
          <TouchableOpacity
            className={`flex-1 items-center ${
              contactMethod === "phone" ? "bg-blue-500" : ""
            }`}
            style={{
              paddingVertical: getResponsiveSize(8),
              borderRadius: getResponsiveSize(6),
              ...(contactMethod === "phone" ? { elevation: 1 } : {}),
            }}
            onPress={() => onContactMethodChange("phone")}
          >
            <Text
              className={`font-roboto-medium ${
                contactMethod === "phone" ? "text-white" : "text-gray-500"
              }`}
              style={{ fontSize: getResponsiveSize(13) }}
            >
              Teléfono
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center ${
              contactMethod === "gps" ? "bg-blue-500" : ""
            }`}
            style={{
              paddingVertical: getResponsiveSize(8),
              borderRadius: getResponsiveSize(6),
              ...(contactMethod === "gps" ? { elevation: 1 } : {}),
            }}
            onPress={() => onContactMethodChange("gps")}
          >
            <Text
              className={`font-roboto-medium ${
                contactMethod === "gps" ? "text-white" : "text-gray-500"
              }`}
              style={{ fontSize: getResponsiveSize(13) }}
            >
              GPS
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 items-center ${
              contactMethod === "both" ? "bg-blue-500" : ""
            }`}
            style={{
              paddingVertical: getResponsiveSize(8),
              borderRadius: getResponsiveSize(6),
              ...(contactMethod === "both" ? { elevation: 1 } : {}),
            }}
            onPress={() => onContactMethodChange("both")}
          >
            <Text
              className={`font-roboto-medium ${
                contactMethod === "both" ? "text-white" : "text-gray-500"
              }`}
              style={{ fontSize: getResponsiveSize(13) }}
            >
              Ambos
            </Text>
          </TouchableOpacity>
        </View>

        {(contactMethod === "phone" || contactMethod === "both") && (
          <View style={{ marginBottom: getResponsiveSize(14) }}>
            <Text
              className="font-roboto text-gray-700"
              style={{
                fontSize: getResponsiveSize(13),
                marginBottom: getResponsiveSize(6),
              }}
            >
              Teléfono celular del propietario del negocio
            </Text>
            <View
              className={`flex-row items-center border overflow-hidden ${
                phoneError
                  ? "border-red-500 bg-red-50"
                  : clientPhone
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50"
              }`}
              style={{ borderRadius: getResponsiveSize(12) }}
            >
              <View
                className={`justify-center items-center border-r ${
                  phoneError
                    ? "bg-red-300 border-r-red-500"
                    : clientPhone
                    ? "bg-blue-100 border-r-blue-500"
                    : "border-r-gray-300"
                }`}
                style={{
                  width: getResponsiveHeight(45),
                  height: getResponsiveHeight(45),
                }}
              >
                <Feather
                  name="phone"
                  size={18}
                  color={phoneError ? "#991B1B" : clientPhone ? "#3B82F6" : "#9CA3AF"}
                />
              </View>
              <TextInput
                className={`flex-1 font-roboto bg-transparent ${
                  phoneError ? "text-red-800" : "text-gray-900"
                }`}
                style={{
                  height: getResponsiveHeight(45),
                  paddingHorizontal: getResponsiveSize(12),
                  fontSize: getResponsiveSize(14),
                }}
                placeholder="Ej: (664)-123-4567"
                value={clientPhone}
                onChangeText={onClientPhoneChange}
                keyboardType="phone-pad"
                maxLength={14}
                placeholderTextColor={phoneError ? "#F87171" : "#9CA3AF"}
                contextMenuHidden={true}
                onFocus={() => onInputFocus?.("phone")}
              />
            </View>
            {phoneError ? (
              <Text className="text-red-500 text-xs mt-1.5 ml-1">
                {phoneError}
              </Text>
            ) : null}
          </View>
        )}

        {(contactMethod === "gps" || contactMethod === "both") && (
          <View>
            <Text
              className="font-roboto text-gray-700"
              style={{
                fontSize: getResponsiveSize(13),
                marginBottom: getResponsiveSize(6),
              }}
            >
              Ubicación del negocio
            </Text>

            {isLocationLoading && !isStatusModalVisible ? (
              <MediaCardSkeleton />
            ) : location ? (
              <LocationMap
                location={location}
                mapRegion={mapRegion}
                onLocationChange={onLocationChange}
                onRefreshLocation={onGetLocation}
                markerTitle="Ubicación del Cliente"
              />
            ) : (
              <TouchableOpacity
                className={`flex-row items-center justify-center py-3.5 rounded-xl ${
                  !isBasicInfoFilled ? "bg-gray-300" : "bg-blue-500 active:opacity-90"
                }`}
                onPress={onGetLocation}
                disabled={!isBasicInfoFilled}
              >
                <Feather name="navigation" size={16} color="#FFFFFF" />
                <Text
                  className="font-roboto-medium text-white ml-2"
                  style={{ fontSize: getResponsiveSize(14) }}
                >
                  Obtener ubicación
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};
