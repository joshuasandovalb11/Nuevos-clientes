import * as Device from "expo-device";
import { Stack, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Keyboard, View } from "react-native";
import { AuthScreen } from "../src/components/auth/AuthScreen";
import { StatusModal } from "../src/components/modals/StatusModal";
import { requestSms, resendSms, resetSms, verifyPin } from "../src/services/api";
import { getDeviceUuid, getSessionToken, getUserInfo, setSessionToken, setUserInfo } from "../src/utils/storage";

const APP_ID = 1;

export default function LoginScreen() {
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
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await getSessionToken();
      if (token) {
        // Si hay token, nos saltamos el login y vamos al formulario
        const userInfo = await getUserInfo();
        router.replace({
          pathname: "/form",
          params: {
            salespersonName: userInfo?.name || "Vendedor",
            salespersonPhone: userInfo?.phone || ""
          }
        });
      } else {
        // Aseguramos que el deviceUuid se genere si es primera vez
        await getDeviceUuid();
        setIsAppLoading(false);
      }
    } catch {
      setIsAppLoading(false);
    }
  };

  const handleRequestSms = async () => {
    if (!userPhoneNumber || userPhoneNumber.length !== 10) {
      showErrorModal("Número Inválido", "Por favor, ingresa tu número de teléfono a 10 dígitos.");
      return;
    }

    setAuthIsLoading(true);
    try {
      Keyboard.dismiss();

      try { await resetSms(userPhoneNumber); } catch (e) { /* ignorar si falla el reset */ }

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
      pathname: "/form",
      params: {
        salespersonName: salespersonName,
        salespersonPhone: userPhoneNumber
      }
    });
  };

  if (isAppLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
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
