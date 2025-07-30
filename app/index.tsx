import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// 1. Importa las librerías que instalamos
import * as Location from 'expo-location';
import * as MailComposer from 'expo-mail-composer';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Función para calcular tamaños responsivos
const getResponsiveSize = (baseSize: number) => {
  const scale = width / 375; // 375 es el ancho base (iPhone X)
  const newSize = baseSize * scale;
  return Math.max(newSize, baseSize * 0.8); // Mínimo 80% del tamaño base
};

// Función para calcular alturas responsivas
const getResponsiveHeight = (baseHeight: number) => {
  const scale = height / 812; // 812 es la altura base (iPhone X)
  return Math.max(baseHeight * scale, baseHeight * 0.7);
};

// Detectar si es un dispositivo pequeño
const isSmallDevice = width < 360 || height < 640;
const isMediumDevice = width >= 360 && width < 400;
const isLargeDevice = width >= 400;

export default function HomeScreen() {
  const [clientNumber, setClientNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 32.5333,
    longitude: -117.0167,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  // Pide permisos de ubicación al cargar la app
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación para usar esta función.');
        return;
      }
    })();
  }, []);

  // Función para obtener la ubicación actual del GPS
  const handleGetLocation = async () => {
    setIsLoading(true);
    try {
      // Obtiene la posición actual con alta precisión
      const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      setLocation(coords);
      // Centra el mapa en la nueva ubicación
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } catch (error) {
      Alert.alert("Error de Ubicación", "No se pudo obtener la ubicación. Asegúrate de que tu GPS esté activado.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para enviar el correo con toda la información
  const handleSendEmail = async () => {
    if (!clientNumber || !clientName || !location) {
      Alert.alert("Datos incompletos", "Por favor, completa todos los campos y obtén la ubicación.");
      return;
    }

    const { latitude, longitude } = location;
    
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    const recipients = ['correo1@empresa.com', 'gerente.ventas@empresa.com'];
    
    const body = `
      <h1>Registro de Nuevo Cliente</h1>
      <p>Se ha registrado un nuevo cliente con la siguiente información:</p>
      <ul>
        <li><strong>Número de Cliente:</strong> ${clientNumber}</li>
        <li><strong>Nombre del Cliente:</strong> ${clientName}</li>
        <li><strong>Coordenadas:</strong> Lat: ${latitude}, Lon: ${longitude}</li>
      </ul>
      <p><strong>Ver ubicación en el mapa:</strong></p>
      <a href="${mapLink}">${mapLink}</a>
    `;

    // Abre el cliente de correo del dispositivo
    await MailComposer.composeAsync({
      recipients: recipients,
      subject: `Registro de Cliente: ${clientName} (#${clientNumber})`,
      body: body,
      isHtml: true,
    });
  };

  const isFormComplete = clientNumber && clientName && location;

  // Calcular la altura disponible para el contenido antes del mapa
  const availableHeight = height - (Platform.OS === 'android' ? 100 : 140); // Restamos header y status bar

  return (
    <ScrollView 
      style={styles.scrollContainer} 
      contentContainerStyle={location ? styles.scrollContentWithMap : styles.scrollContentNoMap}
      showsVerticalScrollIndicator={!!location}
    >
      <View style={location ? styles.containerWithMap : [styles.containerCentered, { minHeight: availableHeight }]}>
        
        {/* Header Card */}
        <View style={[styles.headerCard, { marginBottom: getResponsiveSize(isSmallDevice ? 8 : 12) }]}>
          <Text style={styles.subtitle}>Completa la información del nuevo cliente</Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { marginBottom: getResponsiveSize(isSmallDevice ? 8 : 12) }]}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Número de Cliente</Text>
            <TextInput
              style={[styles.input, clientNumber && styles.inputFilled]}
              placeholder="Ej: 001234"
              value={clientNumber}
              onChangeText={setClientNumber}
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del Cliente</Text>
            <TextInput
              style={[styles.input, clientName && styles.inputFilled]}
              placeholder="Nombre completo del cliente"
              value={clientName}
              onChangeText={setClientName}
              keyboardType="default"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Location Button */}
          <View style={styles.locationSection}>
            <Text style={styles.inputLabel}>Ubicación del Cliente</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size={isSmallDevice ? "small" : "large"} color="#3B82F6" />
                <Text style={styles.loadingText}>Obteniendo ubicación...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.locationButton} onPress={handleGetLocation}>
                <Text style={styles.locationButtonText}>
                  {location ? '📍 Actualizar Ubicación' : '🌍 Obtener Ubicación Actual'}
                </Text>
              </TouchableOpacity>
            )}
            
            {location && (
              <View style={styles.coordinatesCard}>
                <Text style={styles.coordinatesTitle}>Coordenadas Registradas:</Text>
                <Text style={styles.coordinatesText}>
                  📍 {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isFormComplete && styles.submitButtonActive]}
          onPress={handleSendEmail}
          disabled={!isFormComplete}
        >
          <Text style={[styles.submitButtonText, isFormComplete && styles.submitButtonTextActive]}>
            {isFormComplete ? '📧 Enviar Registro' : '⚠️ Completa todos los campos'}
          </Text>
        </TouchableOpacity>

        {/* Progress Indicator */}
        {!location && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[
                styles.progressFill, 
                { width: `${(
                  (clientNumber ? 33 : 0) + 
                  (clientName ? 33 : 0) + 
                  (location ? 34 : 0)
                )}%` }
              ]} />
            </View>
            <Text style={styles.progressText}>
              Progreso: {Math.round((clientNumber ? 33 : 0) + (clientName ? 33 : 0) + (location ? 34 : 0))}%
            </Text>
          </View>
        )}

      </View>

      {/* Map Section - Solo se muestra después de obtener ubicación */}
      {location && (
        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>🗺️ Ubicación en el Mapa</Text>
          <Text style={styles.mapSubtitle}>Arrastra el marcador para ajustar la posición exacta</Text>
          <MapView
            style={styles.map}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
          >
            <Marker
              draggable
              coordinate={location}
              title="Ubicación del Cliente"
              description="Arrastra para ajustar la posición exacta"
              onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
            />
          </MapView>
          
          {/* Progress Indicator después del mapa */}
          <View style={[styles.progressContainer, { marginTop: getResponsiveSize(16) }]}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
            <Text style={styles.progressText}>Formulario Completo ✓</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContentNoMap: {
    flexGrow: 1,
  },
  scrollContentWithMap: {
    flexGrow: 1,
    paddingBottom: getResponsiveSize(20),
  },
  containerCentered: {
    flex: 1,
    padding: getResponsiveSize(isSmallDevice ? 12 : 16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerWithMap: {
    padding: getResponsiveSize(isSmallDevice ? 12 : 16),
    paddingTop: getResponsiveSize(8),
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(isSmallDevice ? 12 : 16),
    padding: getResponsiveSize(isSmallDevice ? 16 : 20),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: getResponsiveSize(isSmallDevice ? 20 : isMediumDevice ? 24 : 28),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveSize(4),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: getResponsiveSize(isSmallDevice ? 12 : isMediumDevice ? 14 : 16),
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(isSmallDevice ? 12 : 16),
    padding: getResponsiveSize(isSmallDevice ? 16 : 20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    marginBottom: getResponsiveSize(isSmallDevice ? 12 : 16),
  },
  inputLabel: {
    fontSize: getResponsiveSize(isSmallDevice ? 13 : isMediumDevice ? 14 : 16),
    fontWeight: '600',
    color: '#374151',
    marginBottom: getResponsiveSize(6),
  },
  input: {
    backgroundColor: '#F9FAFB',
    height: getResponsiveHeight(isSmallDevice ? 44 : isMediumDevice ? 50 : 56),
    borderColor: '#D1D5DB',
    borderWidth: 2,
    borderRadius: getResponsiveSize(isSmallDevice ? 8 : 12),
    paddingHorizontal: getResponsiveSize(12),
    fontSize: getResponsiveSize(isSmallDevice ? 14 : 16),
    color: '#111827',
  },
  inputFilled: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  locationSection: {
    marginTop: getResponsiveSize(4),
  },
  locationButton: {
    backgroundColor: '#3B82F6',
    borderRadius: getResponsiveSize(isSmallDevice ? 8 : 12),
    paddingVertical: getResponsiveSize(isSmallDevice ? 12 : 16),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveSize(isSmallDevice ? 13 : isMediumDevice ? 14 : 16),
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSize(16),
  },
  loadingText: {
    marginTop: getResponsiveSize(8),
    fontSize: getResponsiveSize(isSmallDevice ? 13 : 16),
    color: '#6B7280',
  },
  coordinatesCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: getResponsiveSize(isSmallDevice ? 8 : 12),
    padding: getResponsiveSize(12),
    marginTop: getResponsiveSize(8),
    borderColor: '#10B981',
    borderWidth: 1,
  },
  coordinatesTitle: {
    fontSize: getResponsiveSize(isSmallDevice ? 11 : 14),
    fontWeight: '600',
    color: '#065F46',
    marginBottom: getResponsiveSize(2),
  },
  coordinatesText: {
    fontSize: getResponsiveSize(isSmallDevice ? 12 : isMediumDevice ? 13 : 16),
    color: '#047857',
    fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(isSmallDevice ? 12 : 16),
    padding: getResponsiveSize(isSmallDevice ? 16 : 20),
    margin: getResponsiveSize(isSmallDevice ? 12 : 16),
    marginTop: getResponsiveSize(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapTitle: {
    fontSize: getResponsiveSize(isSmallDevice ? 16 : isMediumDevice ? 18 : 20),
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveSize(2),
  },
  mapSubtitle: {
    fontSize: getResponsiveSize(isSmallDevice ? 11 : isMediumDevice ? 12 : 14),
    color: '#6B7280',
    marginBottom: getResponsiveSize(12),
  },
  map: {
    width: '100%',
    height: getResponsiveHeight(isSmallDevice ? 200 : isMediumDevice ? 225 : 250),
    borderRadius: getResponsiveSize(isSmallDevice ? 8 : 12),
    overflow: 'hidden',
  },
  submitButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: getResponsiveSize(isSmallDevice ? 8 : 12),
    paddingVertical: getResponsiveSize(isSmallDevice ? 14 : 18),
    paddingHorizontal: getResponsiveSize(16),
    alignItems: 'center',
    marginBottom: getResponsiveSize(isSmallDevice ? 12 : 16),
    width: '100%',
    maxWidth: 400,
  },
  submitButtonActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: getResponsiveSize(isSmallDevice ? 13 : isMediumDevice ? 14 : 16),
    fontWeight: '600',
    color: '#9CA3AF',
  },
  submitButtonTextActive: {
    color: '#FFFFFF',
  },
  progressContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: getResponsiveSize(isSmallDevice ? 6 : 8),
    backgroundColor: '#E5E7EB',
    borderRadius: getResponsiveSize(4),
    overflow: 'hidden',
    marginBottom: getResponsiveSize(6),
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: getResponsiveSize(4),
  },
  progressText: {
    fontSize: getResponsiveSize(isSmallDevice ? 11 : isMediumDevice ? 12 : 14),
    color: '#6B7280',
    fontWeight: '500',
  },
});