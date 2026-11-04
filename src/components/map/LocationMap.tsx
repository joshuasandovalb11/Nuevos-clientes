import React from "react";
import { Text, View } from "react-native";
import MapView, { Marker, Region } from "react-native-maps";
import { getResponsiveHeight, getResponsiveSize } from "../../utils/helpers";

interface LocationMapProps {
  location: { latitude: number; longitude: number };
  mapRegion: Region;
}

export const LocationMap: React.FC<LocationMapProps> = ({
  location,
  mapRegion,
}) => {
  return (
    <View
      style={{
        marginTop: getResponsiveSize(8),
        marginBottom: getResponsiveSize(16),
      }}
    >
      <View style={{ padding: getResponsiveSize(20) }}>
        <Text
          className="font-poppins-bold text-gray-600"
          style={{
            fontSize: getResponsiveSize(16),
            marginBottom: getResponsiveSize(2),
          }}
        >
          Ubicación en el mapa
        </Text>
        <Text
          className="font-roboto text-gray-500"
          style={{
            fontSize: getResponsiveSize(14),
            marginBottom: getResponsiveSize(12),
          }}
        >
          Esta es la ubicación exacta que fue obtenida.
        </Text>
        <View
          className="w-full overflow-hidden"
          style={{
            height: getResponsiveHeight(250),
            borderRadius: getResponsiveSize(12),
          }}
        >
          <MapView
            style={{ width: "100%", height: "100%" }}
            region={mapRegion}
          >
            <Marker
              coordinate={location}
              title="Ubicación del Cliente"
              description="Ubicación confirmada"
            />
          </MapView>
        </View>
      </View>
    </View>
  );
};
