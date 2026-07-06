import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
    <View style={styles.mapContainer}>
      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>Ubicación en el mapa</Text>
        <Text style={styles.mapSubtitle}>
          Esta es la ubicación exacta que fue obtenida.
        </Text>
        <MapView
          style={styles.map}
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
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    marginTop: getResponsiveSize(8),
    marginBottom: getResponsiveSize(16),
  },
  mapCard: {
    padding: getResponsiveSize(20),
  },
  mapTitle: {
    fontSize: getResponsiveSize(16),
    fontFamily: "Poppins_700Bold",
    color: "#4B5563",
    marginBottom: getResponsiveSize(2),
  },
  mapSubtitle: {
    fontFamily: "Roboto_400Regular",
    fontSize: getResponsiveSize(14),
    color: "#6B7280",
    marginBottom: getResponsiveSize(12),
  },
  map: {
    width: "100%",
    height: getResponsiveHeight(250),
    borderRadius: getResponsiveSize(12),
    overflow: "hidden",
  },
});
