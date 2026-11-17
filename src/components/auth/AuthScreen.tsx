// src/components/auth/AuthScreen.tsx
import { Feather, MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatPhoneNumber,
  getResponsiveHeight,
  getResponsiveSize,
} from "../../utils/helpers";

interface AuthScreenProps {
  step: 'phone' | 'pin' | 'success';
  userPhoneNumber: string;
  onPhoneNumberChange: (text: string) => void;
  pin: string;
  onPinChange: (text: string) => void;
  onVerifyPhone: () => void;
  onVerifyPin: () => void;
  onResendSms: () => void;
  isLoading: boolean;
  onGoBack: () => void;
  onContinueToForm: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  step,
  userPhoneNumber,
  onPhoneNumberChange,
  pin,
  onPinChange,
  onVerifyPhone,
  onVerifyPin,
  onResendSms,
  isLoading,
  onGoBack,
  onContinueToForm,
}) => {
  const [timer, setTimer] = useState(40);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);
  const scrollViewRef = useRef<KeyboardAwareScrollViewRef>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
  }, [step]);

  useEffect(() => {
    if (step !== 'pin' || timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timer]);

  const handleVerifyPhonePress = () => {
    setOtp(Array(6).fill(""));
    setTimer(40);
    onVerifyPhone();
  };

  const handleGoBackPress = () => {
    setOtp(Array(6).fill(""));
    setTimer(40);
    onGoBack();
  };

  const handleResend = () => {
    if (timer === 0) {
      setTimer(40);
      onResendSms();
    }
  };

  const renderProgressBar = () => {
    const getBarClass = (barStep: 'phone' | 'pin' | 'success') => {
      if (step === 'success') return "bg-blue-500";
      if (step === 'pin' && (barStep === 'phone' || barStep === 'pin')) return "bg-blue-500";
      if (step === 'phone' && barStep === 'phone') return "bg-blue-500";
      return "bg-gray-200";
    };

    return (
      <View className="flex-row justify-between w-full mb-8 px-2">
        <View className={`h-1.5 flex-1 rounded-[3px] mx-1 ${getBarClass('phone')}`} />
        <View className={`h-1.5 flex-1 rounded-[3px] mx-1 ${getBarClass('pin')}`} />
        <View className={`h-1.5 flex-1 rounded-[3px] mx-1 ${getBarClass('success')}`} />
      </View>
    );
  };

  const handleOtpChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, "");

    if (cleanText.length > 1) {
      const pasted = cleanText.slice(0, 6).split("");
      const newOtp = Array(6).fill("");
      pasted.forEach((char, i) => { newOtp[i] = char; });
      setOtp(newOtp);
      onPinChange(newOtp.join(''));

      if (pasted.length === 6) {
        Keyboard.dismiss();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanText.slice(-1);

    setOtp(newOtp);
    onPinChange(newOtp.join(''));

    if (cleanText !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
      onPinChange(newOtp.join(''));
    }
  };

  const renderPinBoxes = () => {
    return (
      <View className="flex-row justify-between w-full mb-6 relative">
        {otp.map((digit, index) => {
          const isActive = focusedIndex === index;

          return (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              className={`rounded-xl justify-center items-center font-poppins-bold text-gray-800 text-center ${
                isActive
                  ? "border-2 border-blue-500 bg-blue-50"
                  : digit !== ""
                  ? "border border-gray-600 bg-white"
                  : "border border-gray-300 bg-gray-50"
              }`}
              style={{
                width: getResponsiveSize(42),
                height: getResponsiveSize(52),
                fontSize: getResponsiveSize(20),
              }}
              value={digit}
              onFocus={() => setFocusedIndex(index)}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleOtpKeyPress(e, index)}
              keyboardType="number-pad"
              textContentType={index === 0 ? "oneTimeCode" : "none"}
              maxLength={6}
              editable={!isLoading}
              autoFocus={step === 'pin' && index === 0}
              contextMenuHidden={true}
              caretHidden={true}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <KeyboardAwareScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: "#F8FAFC" }}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={getResponsiveSize(90)}
        extraKeyboardSpace={getResponsiveSize(20)}
      >
        <View className="px-5 py-[50px] bg-[#F8FAFC] items-center">
          <View className="w-full max-w-[400px] p-8 items-center">

            {renderProgressBar()}

            {step === 'phone' && (
              <>
                <Text
                  className="font-poppins-bold text-gray-800 mb-2 text-center"
                  style={{ fontSize: getResponsiveSize(18) }}
                >
                  Verificación de Empleado
                </Text>
                <Text
                  className="font-roboto text-gray-500 mb-8 text-center leading-5"
                  style={{ fontSize: getResponsiveSize(14) }}
                >
                  Ingresa tu número de teléfono para acceder.
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 font-roboto text-gray-900 w-full text-center tracking-[2px]"
                  style={{
                    height: getResponsiveHeight(50),
                    borderRadius: getResponsiveSize(12),
                    paddingHorizontal: getResponsiveSize(16),
                    fontSize: getResponsiveSize(14),
                  }}
                  placeholder="Teléfono (10 dígitos)"
                  value={formatPhoneNumber(userPhoneNumber)}
                  onChangeText={onPhoneNumberChange}
                  keyboardType="phone-pad"
                  maxLength={12}
                  placeholderTextColor="#9CA3AF"
                  editable={!isLoading}
                  contextMenuHidden={true}
                />
                {isLoading ? (
                  <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                ) : (
                  <TouchableOpacity
                    className="mt-4 bg-blue-500 py-4 px-6 rounded-2xl w-full items-center flex-row gap-2 justify-center shadow-md shadow-blue-500/20"
                    style={{ elevation: 4 }}
                    onPress={handleVerifyPhonePress}
                  >
                    <Text
                      className="font-roboto-medium text-white font-semibold"
                      style={{ fontSize: getResponsiveHeight(14) }}
                    >
                      Continuar
                    </Text>
                    <Feather name="arrow-right" size={16} color={"#FFFFFF"} />
                  </TouchableOpacity>
                )}
              </>
            )}

            {step === 'pin' && (
              <>
                <Text
                  className="font-poppins-bold text-gray-800 mb-2 text-center"
                  style={{ fontSize: getResponsiveSize(18) }}
                >
                  Código de Seguridad
                </Text>
                <Text
                  className="font-roboto text-gray-500 mb-8 text-center leading-5"
                  style={{ fontSize: getResponsiveSize(14) }}
                >
                  Ingresa el código de 6 dígitos enviado al{" "}
                  <Text className="font-bold text-blue-500">
                    {formatPhoneNumber(userPhoneNumber)}
                  </Text>.
                </Text>

                {renderPinBoxes()}

                {isLoading ? (
                  <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 20 }} />
                ) : (
                  <>
                    <TouchableOpacity
                      className="mt-4 bg-blue-500 py-4 px-6 rounded-2xl w-full items-center flex-row gap-2 justify-center shadow-md shadow-blue-500/20"
                      style={{ elevation: 4 }}
                      onPress={onVerifyPin}
                    >
                      <Text
                        className="font-roboto-medium text-white font-semibold"
                        style={{ fontSize: getResponsiveHeight(14) }}
                      >
                        Verificar PIN
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`mt-4 py-3.5 px-6 rounded-2xl w-full items-center border ${
                        timer > 0
                          ? "bg-gray-100 border-gray-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                      onPress={handleResend}
                      disabled={timer > 0 || isLoading}
                    >
                      <Text
                        className={`font-roboto-medium text-sm ${
                          timer > 0 ? "text-gray-400" : "text-blue-600"
                        }`}
                      >
                        {timer > 0 ? `Reenviar Código en ${timer}s` : "Reenviar Código"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity className="mt-5 p-2" onPress={handleGoBackPress}>
                      <Text className="font-roboto text-gray-500 text-sm">
                        Usar otro número
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {step === 'success' && (
              <View className="items-center w-full py-4">
                <View
                  className="w-20 h-20 rounded-full bg-emerald-500 justify-center items-center mb-6 shadow-lg shadow-emerald-500/30"
                  style={{ elevation: 5 }}
                >
                  <MaterialIcons name="check" size={48} color="#FFFFFF" />
                </View>
                <Text
                  className="font-poppins-bold text-gray-800 mb-2 text-center"
                  style={{ fontSize: getResponsiveSize(18) }}
                >
                  ¡Dispositivo Vinculado!
                </Text>
                <Text
                  className="font-roboto text-gray-500 mb-8 text-center leading-5"
                  style={{ fontSize: getResponsiveSize(14) }}
                >
                  Tu teléfono ha quedado registrado exitosamente y puedes comenzar a registrar clientes.
                </Text>
                <TouchableOpacity
                  className="mt-4 bg-blue-500 py-4 px-6 rounded-2xl w-full items-center flex-row gap-2 justify-center shadow-md shadow-blue-500/20"
                  style={{ elevation: 4 }}
                  onPress={onContinueToForm}
                >
                  <Text
                    className="font-roboto-medium text-white font-semibold"
                    style={{ fontSize: getResponsiveHeight(14) }}
                  >
                    Ir al Formulario
                  </Text>
                  <Feather name="arrow-right" size={16} color={"#FFFFFF"} />
                </TouchableOpacity>
              </View>
            )}

          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};
