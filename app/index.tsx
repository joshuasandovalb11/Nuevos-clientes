import { Stack, router } from "expo-router";
import React, { useState } from "react";
import { Alert, Keyboard } from "react-native";
import { AuthScreen } from "../src/components/auth/AuthScreen";
import { verifyUser } from "../src/services/api";

export default function LoginScreen() {
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  const [authIsLoading, setAuthIsLoading] = useState(false);

  const handleVerifyUser = async () => {
    if (!userPhoneNumber || userPhoneNumber.length !== 10) {
      Alert.alert(
        "Número Inválido",
        "Por favor, ingresa tu número de teléfono a 10 dígitos."
      );
      return;
    }
    setAuthIsLoading(true);
    try {
      Keyboard.dismiss();
      const result = await verifyUser(userPhoneNumber);
      
      router.replace({
        pathname: "/form",
        params: {
          salespersonName: result.user.name,
          salespersonPhone: result.user.phone,
        },
      });
    } catch (error: any) {
      Alert.alert("Acceso Denegado", error.message);
    } finally {
      setAuthIsLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <AuthScreen
        userPhoneNumber={userPhoneNumber}
        onPhoneNumberChange={(text) =>
          setUserPhoneNumber(text.replace(/[^0-9]/g, ""))
        }
        onVerify={handleVerifyUser}
        isLoading={authIsLoading}
      />
    </>
  );
}
