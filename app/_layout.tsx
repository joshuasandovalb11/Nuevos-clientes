import { Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import * as Cellular from 'expo-cellular';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { AppState, StatusBar, StyleSheet } from 'react-native';
import { clearSessionToken, getSessionToken } from '../src/utils/storage';
import { OTAUpdater } from '../src/components/OTAUpdater';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Roboto_400Regular,
    Roboto_500Medium,
  });

  useEffect(() => {
    const checkSimPresence = async () => {
      try {
        const token = await getSessionToken();
        if (!token) return;

        const carrier = await Cellular.getCarrierNameAsync();
        const mcc = await Cellular.getMobileCountryCodeAsync();

        if (!mcc && !carrier) {
          console.warn('⚠️ [Seguridad] SIM no detectada. Expulsando usuario.');
          await clearSessionToken();
          router.replace("/");
        }
      } catch (e) {
        console.error('Error comprobando la SIM:', e);
      }
    };

    checkSimPresence();

    const intervalId = setInterval(() => {
      if (appState.current === 'active') {
        checkSimPresence();
      }
    }, 5000);

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkSimPresence();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <OTAUpdater />
      {/* Configuración de la barra de estado */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="form"
          options={{
            title: 'Registro de Cliente',
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    color: '#1F2937',
    letterSpacing: 0.2,
  },
});