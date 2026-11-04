import * as Application from 'expo-application';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, TouchableOpacity, View, Platform, AppState, AppStateStatus } from 'react-native';

interface UpdateManifest {
  version: string;
  versionCode: number;
  isMandatory: boolean;
  notes: string;
  downloadUrl: string;
}

export const OTAUpdater = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [manifest, setManifest] = useState<UpdateManifest | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkUpdate = async () => {
      if (Platform.OS !== 'android') return; // Sideloading nativo solo funciona en Android

      try {
        const response = await fetch('http://toolsdemexico.net:3001/updates/v2/registrar-clientes/android/android/estable/manifest');
        if (!response.ok) return; // Si da 404, no hay actualización

        const data: UpdateManifest = await response.json();
        const currentVersionCode = parseInt(Application.nativeBuildVersion || '1', 10);

        if (data.versionCode > currentVersionCode) {
          setManifest(data);
          setIsVisible(true);
        }
      } catch (e) {
        console.warn('OTA Check Failed', e);
      }
    };

    // Revisar al iniciar
    checkUpdate();

    // Revisar al regresar del background
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkUpdate();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDownloadAndInstall = async () => {
    if (!manifest) return;

    setIsDownloading(true);
    setErrorMsg("");
    setDownloadProgress(0);

    const fileUri = `${FileSystem.documentDirectory}update.apk`;

    const downloadResumable = FileSystem.createDownloadResumable(
      manifest.downloadUrl,
      fileUri,
      {},
      (downloadProgressInfo) => {
        const progress = (downloadProgressInfo.totalBytesWritten / downloadProgressInfo.totalBytesExpectedToWrite) * 100;
        setDownloadProgress(progress);
      }
    );

    try {
      const result = await downloadResumable.downloadAsync();
      
      if (result && result.uri) {
        // Para Android 7.0+ forzar cambio a content:// 
        const contentUri = await FileSystem.getContentUriAsync(result.uri);
        
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: 'application/vnd.android.package-archive',
        });
        
        // Regresamos el estado a falso para que puedan re-intentar si cancelaron la instalación en la ventana nativa
        setIsDownloading(false);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error al descargar la actualización. Intenta de nuevo.");
      setIsDownloading(false);
    }
  };

  const handleCancel = () => {
    if (!manifest?.isMandatory) {
      setIsVisible(false);
    }
  };

  if (!manifest) return null;

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade">
      <View className="flex-1 bg-black/60 justify-center items-center p-6">
        <View
          className="bg-white rounded-2xl p-6 w-full max-w-[400px] shadow-xl"
          style={{ elevation: 5 }}
        >
          <Text className="text-xl font-bold text-gray-800 mb-1 text-center">
            Actualización Disponible
          </Text>
          <Text className="text-sm text-gray-500 mb-4 text-center">
            Versión {manifest.version}
          </Text>
          
          <Text className="text-sm text-gray-700 leading-5 mb-6 bg-gray-100 p-3 rounded-lg">
            {manifest.notes}
          </Text>

          {isDownloading ? (
            <View className="items-center">
              <Text className="text-sm font-medium text-blue-500 mb-2">
                Descargando... {Math.round(downloadProgress)}%
              </Text>
              <View className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <View
                  className="h-full bg-blue-500"
                  style={{ width: `${downloadProgress}%` }}
                />
              </View>
              <ActivityIndicator size="small" color="#3B82F6" style={{ marginTop: 12 }} />
            </View>
          ) : (
            <View className="gap-3">
              <TouchableOpacity
                className="bg-blue-500 p-3.5 rounded-lg items-center"
                onPress={handleDownloadAndInstall}
              >
                <Text className="text-white text-base font-bold">
                  Descargar e Instalar
                </Text>
              </TouchableOpacity>
              
              {!manifest.isMandatory && (
                <TouchableOpacity
                  className="p-3.5 rounded-lg items-center"
                  onPress={handleCancel}
                >
                  <Text className="text-gray-500 text-base font-medium">
                    Más tarde
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {errorMsg !== "" && (
            <Text className="mt-3 text-red-500 text-center text-sm">{errorMsg}</Text>
          )}
        </View>
      </View>
    </Modal>
  );
};
