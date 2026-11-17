import { Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Roboto_400Regular, Roboto_500Medium } from '@expo-google-fonts/roboto';
import * as Cellular from 'expo-cellular';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, LogBox, StatusBar, TurboModuleRegistry } from 'react-native';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import "../global.css";
import { OTAUpdater } from '../src/components/OTAUpdater';
import { SplashProvider } from '../src/components/ui/AnimatedSplash';
import { validateSession } from '../src/services/api';
import { clearSessionToken, getSessionToken } from '../src/utils/storage';

LogBox.ignoreLogs([
  'ImageBackground is deprecated and will be removed in a future release',
]);

SplashScreen.preventAutoHideAsync();

const deviceInfoModule = TurboModuleRegistry.get<{
  getConstants?: () => { isEdgeToEdge?: boolean };
}>('DeviceInfo');
const isNativeEdgeToEdge =
  deviceInfoModule?.getConstants?.()?.isEdgeToEdge === true;

export default function RootLayout() {
  const router = useRouter();
  const appState = useRef(AppState.currentState);
  const isCheckingRemoteSession = useRef(false);

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

    const checkRemoteSession = async () => {
      if (isCheckingRemoteSession.current) return;
      isCheckingRemoteSession.current = true;
      try {
        const token = await getSessionToken();
        if (!token) return;

        const sessionStatus = await validateSession();
        if (sessionStatus === "REVOKED") {
          console.warn('⚠️ [Seguridad] Sesión revocada en el servidor. Expulsando usuario.');
          await clearSessionToken();
          router.replace({
            pathname: "/",
            params: { sessionRevoked: "1" },
          });
        }
      } catch (e) {
        console.error('Error comprobando la sesión remota:', e);
      } finally {
        isCheckingRemoteSession.current = false;
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
        appState.current?.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkSimPresence();
        checkRemoteSession();
      }
      appState.current = nextAppState;
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [router]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardProvider
      statusBarTranslucent={isNativeEdgeToEdge ? undefined : true}
      navigationBarTranslucent={isNativeEdgeToEdge ? undefined : true}
    >
      <SplashProvider>
        <OTAUpdater />
        {/* Configuración de la barra de estado */}
        <StatusBar barStyle="dark-content" />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#F8FAFC" },
          headerTitleStyle: {
            fontFamily: 'Poppins_700Bold',
            fontSize: 16,
            color: '#1F2937',
          },
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
          name="menu"
          options={{
            title: 'Menú Principal',
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
        <Stack.Screen
          name="location"
          options={{
            title: 'Registro de Ubicación',
            headerShown: false,
          }}
        />
      </Stack>
    </SplashProvider>
    </KeyboardProvider>
  );
}