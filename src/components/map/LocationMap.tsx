import { Feather } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { getResponsiveSize } from "../../utils/helpers";
import { SkeletonBox } from "../ui/Skeleton";

interface LocationMapProps {
  location: { latitude: number; longitude: number };
  mapRegion?: Region;
  onLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  onRefreshLocation?: () => void;
  markerTitle?: string;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  onLocationChange,
  onRefreshLocation,
  markerTitle = "Ubicación seleccionada",
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPreviewMapReady, setIsPreviewMapReady] = useState(false);
  const [isModalMapReady, setIsModalMapReady] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ latitude: number; longitude: number }>(location);
  const [isDragging, setIsDragging] = useState(false);
  const fullMapRef = useRef<MapView>(null);

  const handleOpenModal = () => {
    setTempCoords(location);
    setIsModalMapReady(false);
    setIsModalVisible(true);
  };

  const handleConfirmLocation = () => {
    onLocationChange?.(tempCoords);
    setIsModalVisible(false);
  };

  const handleRecenter = () => {
    fullMapRef.current?.animateToRegion(
      {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      350
    );
  };

  return (
    <>
      <View
        className="w-full border border-gray-200 overflow-hidden bg-white"
        style={{ borderRadius: getResponsiveSize(12) }}
      >
        {/* Vista previa interactiva del mapa */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleOpenModal}
          className="w-full bg-gray-100 relative overflow-hidden"
          style={{ height: getResponsiveSize(180) }}
        >
          {!isPreviewMapReady && (
            <View className="absolute inset-0 z-10 bg-gray-100">
              <SkeletonBox
                width="100%"
                height="100%"
                borderRadius={0}
                className="bg-gray-200 absolute inset-0"
              />
            </View>
          )}

          <MapView
            style={{ width: "100%", height: "100%" }}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            onMapReady={() => setIsPreviewMapReady(true)}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
            pointerEvents="none"
          >
            <Marker coordinate={location} title={markerTitle} />
          </MapView>

          {/* Píldora flotante idéntica al estilo de la fotografía */}
          <View className="absolute bottom-2.5 right-2.5 bg-black/60 px-2.5 py-1 rounded-lg flex-row items-center shadow-sm">
            <Feather name="maximize-2" size={12} color="#FFFFFF" />
            <Text
              className="font-roboto-medium text-white ml-1.5"
              style={{ fontSize: getResponsiveSize(11) }}
            >
              Toca para ajustar
            </Text>
          </View>
        </TouchableOpacity>

        {/* Barra inferior unificada con el estilo de la tarjeta de fotografía */}
        <View className="flex-row items-center justify-between bg-gray-50 px-3 py-2 border-t border-gray-200">
          <View className="flex-row items-center">
            <Feather name="check-circle" size={15} color="#10B981" />
            <Text
              className="font-roboto-medium text-gray-700 ml-1.5"
              style={{ fontSize: getResponsiveSize(12) }}
            >
              Ubicación capturada
            </Text>
          </View>
          <View
            className="flex-row items-center"
            style={{ gap: getResponsiveSize(8) }}
          >
            {onRefreshLocation && (
              <TouchableOpacity
                className="py-1 px-3 bg-blue-50 border border-blue-200 rounded-lg active:bg-blue-100"
                onPress={onRefreshLocation}
              >
                <Text
                  className="font-roboto-medium text-blue-600"
                  style={{ fontSize: getResponsiveSize(12) }}
                >
                  Recapturar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Modal a Pantalla Completa estilo DiDi / Uber */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-white relative">
          {!isModalMapReady && (
            <View className="absolute inset-0 z-10 bg-gray-100">
              <SkeletonBox
                width="100%"
                height="100%"
                borderRadius={0}
                className="bg-gray-200 absolute inset-0"
              />
            </View>
          )}

          {/* Mapa a pantalla completa */}
          <MapView
            ref={fullMapRef}
            style={{ width: "100%", height: "100%" }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            onMapReady={() => setIsModalMapReady(true)}
            onRegionChange={() => {
              if (!isDragging) setIsDragging(true);
            }}
            onRegionChangeComplete={(region) => {
              setTempCoords({
                latitude: region.latitude,
                longitude: region.longitude,
              });
              setIsDragging(false);
            }}
          />

          {/* Pin Fijo en el Centro de la Pantalla (Estilo DiDi / Uber) */}
          <View
            pointerEvents="none"
            className="absolute inset-0 justify-center items-center"
          >
            <View
              style={{
                alignItems: "center",
                marginBottom: 38,
                transform: [{ translateY: isDragging ? -8 : 0 }],
              }}
            >
              <Feather name="map-pin" size={40} color="#EF4444" />
              <View
                style={{
                  width: 8,
                  height: 4,
                  borderRadius: 4,
                  backgroundColor: "rgba(0,0,0,0.35)",
                  marginTop: 1,
                }}
              />
            </View>
          </View>

          {/* Barra Superior Flotante con botón de Cerrar y Título */}
          <SafeAreaView
            edges={["top"]}
            className="absolute top-0 left-0 right-0 z-20"
          >
            <View
              className="mx-4 mt-2 bg-white/95 border border-gray-200 rounded-2xl p-3 flex-row items-center shadow-lg"
              style={{ elevation: 5 }}
            >
              <TouchableOpacity
                className="w-9 h-9 rounded-xl bg-gray-100 items-center justify-center mr-3 active:bg-gray-200"
                onPress={() => setIsModalVisible(false)}
              >
                <Feather name="arrow-left" size={20} color="#374151" />
              </TouchableOpacity>
              <View className="flex-1">
                <Text
                  className="font-poppins-bold text-gray-800"
                  style={{ fontSize: getResponsiveSize(15) }}
                >
                  Ajustar Ubicación
                </Text>
                <Text
                  className="font-roboto text-gray-500"
                  style={{ fontSize: getResponsiveSize(12) }}
                >
                  Arrastra el mapa para ubicar el pin en el punto exacto
                </Text>
              </View>
            </View>
          </SafeAreaView>

          {/* Botón Flotante para recentrar al GPS original */}
          <View
            className="absolute right-4 z-20"
            style={{ bottom: getResponsiveSize(140) }}
          >
            <TouchableOpacity
              className="w-12 h-12 rounded-full bg-white border border-gray-200 items-center justify-center shadow-lg active:bg-gray-50"
              style={{ elevation: 6 }}
              onPress={handleRecenter}
            >
              <Feather name="crosshair" size={22} color="#2563EB" />
            </TouchableOpacity>
          </View>

          {/* Tarjeta Inferior de Confirmación (Sin mostrar coordenadas numéricas) */}
          <SafeAreaView
            edges={["bottom"]}
            className="absolute bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-xl"
            style={{ elevation: 10 }}
          >
            <View
              style={{
                paddingHorizontal: getResponsiveSize(20),
                paddingTop: getResponsiveSize(14),
                paddingBottom: getResponsiveSize(12),
              }}
            >
              <View className="flex-row items-center justify-center mb-3">
                <View
                  className={`w-2.5 h-2.5 rounded-full mr-2 ${isDragging ? "bg-amber-400" : "bg-emerald-500"
                    }`}
                />
                <Text
                  className="font-roboto-medium text-gray-600"
                  style={{ fontSize: getResponsiveSize(13) }}
                >
                  {isDragging
                    ? "Moviendo el mapa..."
                    : "Punto seleccionado en el mapa"}
                </Text>
              </View>

              <TouchableOpacity
                className="w-full bg-blue-600 rounded-xl py-3.5 flex-row items-center justify-center active:bg-blue-700 shadow-md"
                onPress={handleConfirmLocation}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <Text
                  className="font-roboto-medium text-white ml-2"
                  style={{ fontSize: getResponsiveSize(15) }}
                >
                  Confirmar este punto
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
};
