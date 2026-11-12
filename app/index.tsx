import * as Cellular from 'expo-cellular';
import * as Device from "expo-device";
import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { AuthScreen } from "../src/components/auth/AuthScreen";
import { StatusModal } from "../src/components/modals/StatusModal";
import { useSplash } from "../src/components/ui/AnimatedSplash";
import { AppSessionSkeleton } from "../src/components/ui/Skeleton";
import { requestSms, resendSms, resetSms, verifyPin } from "../src/services/api";
import { getDeviceUuid, getSessionToken, getUserInfo, setSessionToken, setUserInfo } from "../src/utils/storage";

const APP_ID = 1;

export default function LoginScreen() {
  const { markAppReady } = useSplash();
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [step, setStep] = useState<'phone' | 'pin' | 'success'>('phone');
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [authIsLoading, setAuthIsLoading] = useState(false);
  const [salespersonName, setSalespersonName] = useState("");
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [statusModalContent, setStatusModalContent] = useState({
    title: "",
    message: "",
    isError: false,
  });

  const showErrorModal = (title: string, message: string) => {
    setStatusModalContent({ title, message, isError: true });
    setIsStatusModalVisible(true);
  };

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = await getSessionToken();
        if (token) {
          const userInfo = await getUserInfo();
          router.replace({
            pathname: "/menu",
            params: {
              salespersonName: userInfo?.name || "Vendedor",
              salespersonPhone: userInfo?.phone || ""
            }
          });
          setTimeout(() => {
            markAppReady();
          }, 80);
        } else {
          await getDeviceUuid();
          setIsAppLoading(false);
          requestAnimationFrame(() => {
            markAppReady();
          });
        }
      } catch {
        setIsAppLoading(false);
        requestAnimationFrame(() => {
          markAppReady();
        });
      }
    };

    checkExistingSession();
  }, [markAppReady]);

  const handleRequestSms = async () => {
    if (!userPhoneNumber || userPhoneNumber.length !== 10) {
      showErrorModal("Número Inválido", "Por favor, ingresa tu número de teléfono a 10 dígitos.");
      return;
    }

    try {
      const carrier = await Cellular.getCarrierNameAsync();
      const mcc = await Cellular.getMobileCountryCodeAsync();

      if (!mcc && !carrier) {
        showErrorModal("SIM Requerida", "Se requiere tener una tarjeta SIM insertada en este dispositivo para poder iniciar sesión.");
        return;
      }
    } catch (e) {
      console.warn("No se pudo verificar la SIM", e);
    }

    setAuthIsLoading(true);
    try {
      Keyboard.dismiss();

      try { await resetSms(userPhoneNumber); } catch { /* ignorar si falla el reset */ }

      await requestSms(userPhoneNumber, APP_ID);
      setStep('pin');
    } catch (error: any) {
      showErrorModal("Error", error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (!pinCode || pinCode.length !== 6) {
      showErrorModal("PIN Inválido", "El PIN debe tener 6 dígitos.");
      return;
    }

    setAuthIsLoading(true);
    try {
      Keyboard.dismiss();
      const deviceUuid = await getDeviceUuid();
      const deviceModel = Device.modelName || "Desconocido";
      const result = await verifyPin(userPhoneNumber, APP_ID, pinCode, deviceUuid, deviceModel);

      // Guardar sesión y datos de usuario
      await setSessionToken(result.token_sesion || "dummy_token_if_api_not_ready");

      const sName = result.user?.nombre || "Vendedor";
      await setUserInfo(sName, userPhoneNumber);
      setSalespersonName(sName);

      // Avanzar al paso final de éxito
      setStep('success');
    } catch (error: any) {
      showErrorModal("Acceso Denegado", error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  const handleResendSms = async () => {
    try {
      await resendSms(userPhoneNumber);
    } catch (error: any) {
      showErrorModal("Error", error.message);
    }
  };

  const handleGoBack = async () => {
    try {
      if (userPhoneNumber) {
        await resetSms(userPhoneNumber);
      }
    } catch (error) {
      console.log("Error reseteando SMS:", error);
    }
    setStep('phone');
    setPinCode("");
  };

  const handleContinueToForm = () => {
    router.replace({
      pathname: "/menu",
      params: {
        salespersonName: salespersonName,
        salespersonPhone: userPhoneNumber
      }
    });
  };

  if (isAppLoading) {
    return <AppSessionSkeleton />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthScreen
        step={step}
        userPhoneNumber={userPhoneNumber}
        onPhoneNumberChange={(text) => setUserPhoneNumber(text.replace(/[^0-9]/g, ""))}
        pin={pinCode}
        onPinChange={(text) => setPinCode(text.replace(/[^0-9]/g, ""))}
        onVerifyPhone={handleRequestSms}
        onVerifyPin={handleVerifyPin}
        onResendSms={handleResendSms}
        isLoading={authIsLoading}
        onGoBack={handleGoBack}
        onContinueToForm={handleContinueToForm}
      />
      <StatusModal
        isVisible={isStatusModalVisible}
        onClose={() => setIsStatusModalVisible(false)}
        title={statusModalContent.title}
        message={statusModalContent.message}
        isError={statusModalContent.isError}
      />
    </>
  );
}
