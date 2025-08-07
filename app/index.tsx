/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

// Función para calcular tamaños responsivos
const getResponsiveSize = (baseSize: number) => {
  const scale = width / 375;
  const newSize = baseSize * scale;
  return Math.max(newSize, baseSize * 0.8);
};

// Función para calcular alturas responsivas
const getResponsiveHeight = (baseHeight: number) => {
  const scale = height / 812;
  return Math.max(baseHeight * scale, baseHeight * 0.7);
};

const isSmallDevice = width < 360 || height < 640;
const isMediumDevice = width >= 360 && width < 400;

export default function HomeScreen() {
  // Estos de autenticacion
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userPhoneNumber, setUserPhoneNumber] = useState('');
  const [authIsLoading, setAuthIsLoading] = useState(false);
  // Estados del formulario
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
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [isConfirmSendModalVisible, setIsConfirmSendModalVisible] = useState(false);
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false); 
  const [statusModalContent, setStatusModalContent] = useState({
    title: '',
    message: '',
    isError: false,
  });

  // Funciones de validación

  // Funcion de verificacion de usuario
  const handleVerifyUser = async () => {
    if (!userPhoneNumber || userPhoneNumber.length !== 10) {
      Alert.alert('Número Inválido', 'Por favor, ingresa tu número de teléfono a 10 dígitos.');
      return;
    }

    setAuthIsLoading(true);
    try {
      const response = await fetch('https://backend-email-murex.vercel.app/api/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_phone_number: userPhoneNumber }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        const result = await response.json();
        Alert.alert('Acceso Denegado', result.error || 'Este número no tiene permiso para usar la aplicación.');
      }
    } catch (error) {
      Alert.alert('Error de Conexión', 'No se pudo verificar el usuario. Revisa tu conexión a internet e inténtalo de nuevo.');
    } finally {
      setAuthIsLoading(false);
    }
  };

  // FUNCIÓN PARA FORMATEAR EL NÚMERO DE TELÉFONO
  const formatPhoneNumber = (text: string) => {
    if (!text) return '';

    const numericValue = text.replace(/[^0-9]/g, '');
    const textLength = numericValue.length;

    if (textLength <= 3) {
      return numericValue;
    }
    if (textLength <= 6) {
      return `${numericValue.slice(0, 3)}-${numericValue.slice(3)}`;
    }
    return `${numericValue.slice(0, 3)}-${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
  };

  // MANEJADOR PARA EL TELÉFONO DEL VENDEDOR (Pantalla de Autenticación)
  const handleUserPhoneNumberChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setUserPhoneNumber(numericValue);
  };

  // Manejo de formato del numero de cliente
  const handleClientNumberChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setClientNumber(numericValue);
  };

  // Manejo del formato del nombre del cliente
  const handleClientNameChange = (text: string) => {
    const validName = text.replace(/[^a-zA-Z\s]/g, '');
    setClientName(validName);
  };
  const formatProperCase = (name: string) => {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Efectp para pedir el uso de ubicacion
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita permiso de ubicación para usar esta función.');
        return;
      }
    })();
  }, []);

  // Manejo para obtener ubicacion
  const handleGetLocation = () => {
    setIsLocationModalVisible(true);
  };

  // Confirmacion de permisos oara obtener ubicacion
  const handleConfirmAndGetLocation = async () => {
    setIsLocationModalVisible(false);
    setIsLoading(true);
    try {
      const currentPosition = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      setLocation(coords);
      setMapRegion({
        ...coords,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
     
    } catch (error) {
      setStatusModalContent({
        title: 'Error de Ubicación',
        message: 'No se pudo obtener la ubicación. Asegúrate de que tu GPS esté activado.',
        isError: true,
      });
      setIsStatusModalVisible(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Funcion para inicializar el envio de informacion
  const handleInitiateSend = () => {
    if (!clientNumber || !clientName || !location) {
        setStatusModalContent({
            title: 'Datos incompletos',
            message: 'Por favor, completa todos los campos y obtén la ubicación.',
            isError: true,
        });
        setIsStatusModalVisible(true);
        return;
    }
    setIsConfirmSendModalVisible(true);
  };
  
  // Funcion que se encarga de mandar la informacion del email
  const executeSendEmail = async () => {
    setIsConfirmSendModalVisible(false);
    setIsLoading(true);
    
    if (!location) return;

    const formattedName = formatProperCase(clientName.trim());

    const payload = {
        client_number: clientNumber.trim(),
        client_name: formattedName,
        latitude: location.latitude,
        longitude: location.longitude,
    };

    try {
        const response = await fetch('https://backend-email-murex.vercel.app/api/send-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Ocurrió un error desconocido en el servidor.');
        }

        setStatusModalContent({
            title: '✅ ¡Éxito!',
            message: 'El registro se ha enviado correctamente.',
            isError: false,
        });
        setIsStatusModalVisible(true);

    } catch (error: any) {
        setStatusModalContent({
            title: '❌ Error de Envío',
            message: `No se pudo enviar el registro: ${error.message}`,
            isError: true,
        });
        setIsStatusModalVisible(true);
    } finally {
        setIsLoading(false);
    }
  };

  // Funcion para cerrar el modal y limpiar la informacion en el form
  const handleCloseStatusModal = () => {
    setIsStatusModalVisible(false);
    if (!statusModalContent.isError) {
        setClientName('');
        setClientNumber('');
        setLocation(null);
    }
  };

  const areClientDetailsFilled = clientNumber.trim() !== '' && clientName.trim() !== '';
  const isFormComplete = areClientDetailsFilled && location;
  
  const availableHeight = height - (Platform.OS === 'android' ? 100 : 140);
  
  const progressPercentage = Math.round(
    (clientNumber ? 33 : 0) + 
    (clientName ? 33 : 0) + 
    (location ? 34 : 0)
  );

  if (!isAuthenticated) {
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authTitle}>Verificación de Vendedor</Text>
          <Text style={styles.authSubtitle}>Ingresa tu número de teléfono para poder registrar clientes.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Tu número de teléfono (10 dígitos)"
            value={formatPhoneNumber(userPhoneNumber)}
            onChangeText={handleUserPhoneNumberChange}
            keyboardType="phone-pad"
            maxLength={12}
            placeholderTextColor="#9CA3AF"
          />

          {authIsLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
          ) : (
            <TouchableOpacity style={styles.authButton} onPress={handleVerifyUser}>
              <Text style={styles.authButtonText}>Verificar y Continuar</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView 
        style={styles.scrollContainer} 
        contentContainerStyle={location ? styles.scrollContentWithMap : styles.scrollContentNoMap}
        showsVerticalScrollIndicator={!!location}
        keyboardShouldPersistTaps="handled"
      >
        {/* Modal 1 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isLocationModalVisible}
          onRequestClose={() => setIsLocationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>📍 Confirmar Ubicación</Text>
              <Text style={styles.modalText}>
                Confirma que te encuentras físicamente en la tienda o local del cliente.
              </Text>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsLocationModalVisible(false)}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmAndGetLocation}>
                  <Text style={styles.modalButtonText}>Sí, Obtener Ubicación</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal 2 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isConfirmSendModalVisible}
          onRequestClose={() => setIsConfirmSendModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>✉️ Confirmar Envío</Text>
              <Text style={styles.modalText}>
                Se enviará un correo con la siguiente información. ¿Deseas continuar?
              </Text>
              <View style={styles.dataConfirmContainer}>
                  <Text style={styles.dataConfirmText}>• N° Cliente: <Text style={styles.dataBold}>{clientNumber}</Text></Text>
                  <Text style={styles.dataConfirmText}>• Nombre: <Text style={styles.dataBold}>{formatProperCase(clientName)}</Text></Text>
                </View>
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsConfirmSendModalVisible(false)}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={executeSendEmail}>
                  <Text style={styles.modalButtonText}>Confirmar y Enviar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal 3 */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={isStatusModalVisible}
          onRequestClose={handleCloseStatusModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>{statusModalContent.title}</Text>
              <Text style={styles.modalText}>{statusModalContent.message}</Text>
              <TouchableOpacity 
                  style={[styles.modalButton, statusModalContent.isError ? styles.modalButtonError : styles.modalButtonConfirm, {flex: 0, width: '100%'}]} 
                  onPress={handleCloseStatusModal}
              >
                <Text style={styles.modalButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <View style={location ? styles.containerWithMap : [styles.containerCentered, { minHeight: availableHeight }]}>
          
          <View style={[styles.headerCard, { marginBottom: getResponsiveSize(isSmallDevice ? 8 : 12) }]}>
            <Text style={styles.subtitle}>Completa la información del nuevo cliente</Text>
          </View>

          <View style={[styles.formCard, { marginBottom: getResponsiveSize(isSmallDevice ? 8 : 12) }]}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Número de Cliente</Text>
              <TextInput
                style={[styles.input, clientNumber && styles.inputFilled]}
                placeholder="Ej: 001234"
                value={clientNumber}
                onChangeText={handleClientNumberChange}
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
                onChangeText={handleClientNameChange}
                keyboardType="default"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.locationSection}>
              <Text style={styles.inputLabel}>Ubicación del Cliente</Text>
              {isLoading && !isStatusModalVisible ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size={isSmallDevice ? "small" : "large"} color="#3B82F6" />
                  <Text style={styles.loadingText}>Procesando...</Text>
                </View>
              ) : (
                <TouchableOpacity 
                  style={[styles.locationButton, !areClientDetailsFilled && styles.locationButtonDisabled]} 
                  onPress={handleGetLocation}
                  disabled={!areClientDetailsFilled}
                >
                  <Text style={styles.locationButtonText}>
                    {location ? 'Ubicación Confirmada ✓' : 'Obtener Ubicación del Cliente'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {!location && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
              </View>
              <Text style={styles.progressText}>Progreso: {progressPercentage}%</Text>
            </View>
          )}

        </View>

        {location && (
          <View style={styles.mapAndSubmitContainer}>
            <View style={styles.mapCard}>
              <Text style={styles.mapTitle}>🗺️ Ubicación en el Mapa</Text>
              <Text style={styles.mapSubtitle}>Esta es la ubicación exacta que fue registrada.</Text>
              <MapView
                style={styles.map}
                region={mapRegion}
                onRegionChangeComplete={setMapRegion}
              >
                <Marker
                  coordinate={location}
                  title="Ubicación del Cliente"
                  description="Ubicación confirmada"
                />
              </MapView>
              
              <View style={[styles.progressContainer, { marginTop: getResponsiveSize(16) }]}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {progressPercentage === 100 ? 'Formulario Completo ✓' : `Progreso: ${progressPercentage}%`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, isFormComplete && styles.submitButtonActive]}
              onPress={handleInitiateSend}
              disabled={!isFormComplete || isLoading}
            >
              <Text style={[styles.submitButtonText, isFormComplete && styles.submitButtonTextActive]}>
                {isLoading ? 'Enviando...' : (isFormComplete ? 'Enviar Registro' : '⚠️ Completa todos los campos')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
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
  locationButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
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
    paddingBottom: 0,
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
  mapAndSubmitContainer: {
    paddingHorizontal: getResponsiveSize(isSmallDevice ? 12 : 16),
  },
  mapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(isSmallDevice ? 12 : 16),
    padding: getResponsiveSize(isSmallDevice ? 16 : 20),
    marginTop: getResponsiveSize(8),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapTitle: {
    fontSize: getResponsiveSize(isSmallDevice ? 14 : isMediumDevice ? 16 : 16),
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
    marginTop: getResponsiveSize(isSmallDevice ? 12 : 16),
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    marginBottom: 50,
  },
  submitButtonActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 50,
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
    marginTop: getResponsiveSize(isSmallDevice ? 12 : 16),
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSize(20),
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(16),
    padding: getResponsiveSize(24),
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: getResponsiveSize(18),
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: getResponsiveSize(12),
  },
  modalText: {
    fontSize: getResponsiveSize(14),
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: getResponsiveSize(22),
    marginBottom: getResponsiveSize(24),
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    borderRadius: getResponsiveSize(12),
    paddingVertical: getResponsiveSize(14),
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: getResponsiveSize(6),
  },
  modalButtonCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  modalButtonConfirm: {
    backgroundColor: '#3B82F6',
  },
  modalButtonError: {
    backgroundColor: '#EF4444',
  },
  dataConfirmContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#F9FAFB',
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: getResponsiveSize(16),
    marginBottom: getResponsiveSize(24),
  },
  dataConfirmText: {
    fontSize: getResponsiveSize(14),
    color: '#374151',
    marginBottom: getResponsiveSize(8),
  },
  dataBold: {
    fontWeight: '600',
    color: '#111827',
  },
  modalButtonText: {
    fontSize: getResponsiveSize(14),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonTextCancel: {
    color: '#4B5563',
  },
  // Estilos para el auth
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  authTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  authButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
