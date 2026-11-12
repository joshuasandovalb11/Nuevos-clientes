import * as Application from "expo-application";
import Constants from "expo-constants";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonBox } from "../src/components/ui/Skeleton";
import { getResponsiveSize } from "../src/utils/helpers";
import { getUserInfo } from "../src/utils/storage";

export default function MenuScreen() {
  const appVersion =
    Constants.expoConfig?.version ??
    Application.nativeApplicationVersion ??
    "1.0.3";

  const params = useLocalSearchParams();
  const initialName = typeof params.salespersonName === "string" ? params.salespersonName : "";
  const initialPhone = typeof params.salespersonPhone === "string" ? params.salespersonPhone : "";

  const [salespersonName, setSalespersonName] = useState(initialName);
  const [salespersonPhone, setSalespersonPhone] = useState(initialPhone);
  const [isUserLoading, setIsUserLoading] = useState(!initialName);

  useEffect(() => {
    const loadUser = async () => {
      if (!salespersonName || !salespersonPhone) {
        const info = await getUserInfo();
        if (info) {
          if (!salespersonName) setSalespersonName(info.name || "Vendedor");
          if (!salespersonPhone) setSalespersonPhone(info.phone || "");
        }
      }
      setIsUserLoading(false);
    };
    loadUser();
  }, [salespersonName, salespersonPhone]);

  const handleNavigate = (route: "/form" | "/location", placeCategory?: string) => {
    router.push({
      pathname: route,
      params: {
        salespersonName,
        salespersonPhone,
        ...(placeCategory ? { placeCategory } : {}),
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        className="flex-1 bg-[#F8FAFC]"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingHorizontal: getResponsiveSize(20),
          paddingVertical: getResponsiveSize(30),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full max-w-[500px] self-center">
          <View className="mb-8 items-center justify-center">
            {isUserLoading ? (
              <SkeletonBox
                width={getResponsiveSize(160)}
                height={getResponsiveSize(28)}
                borderRadius={getResponsiveSize(8)}
                className="bg-gray-200 mb-1"
              />
            ) : (
              <Text
                className="font-poppins-bold text-gray-800 text-center"
                style={{ fontSize: getResponsiveSize(22) }}
              >
                Hola,{" "}
                <Text
                  className="font-poppins-bold text-blue-500"
                  style={{ fontSize: getResponsiveSize(22) }}
                >
                  {salespersonName ? salespersonName.split(" ")[0] : "Vendedor"}
                </Text>
              </Text>
            )}
            <Text
              className="font-roboto text-gray-500 text-center mt-1"
              style={{
                fontSize: getResponsiveSize(14),
                lineHeight: getResponsiveSize(20),
              }}
            >
              Selecciona una opción para enviar una ubicación.
            </Text>
          </View>

          <View className="flex-row justify-between items-stretch" style={{ gap: getResponsiveSize(16) }}>
            <TouchableOpacity
              className="flex-1 bg-white border border-gray-200 items-center justify-start shadow-sm active:opacity-80"
              style={{
                borderRadius: getResponsiveSize(20),
                paddingVertical: getResponsiveSize(24),
                paddingHorizontal: getResponsiveSize(12),
                elevation: 2,
              }}
              onPress={() => handleNavigate("/form")}
            >
              <View
                className="bg-[#F49121] overflow-hidden items-center justify-center mb-4 shadow-sm"
                style={{
                  width: getResponsiveSize(96),
                  height: getResponsiveSize(96),
                  borderRadius: getResponsiveSize(22),
                  elevation: 3,
                }}
              >
                <Image
                  source={require("../assets/images/company-menu-icon.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
              <View
                className="w-full items-center justify-center"
                style={{ minHeight: getResponsiveSize(42) }}
              >
                <Text
                  className="font-poppins-bold text-gray-800 text-center"
                  style={{
                    fontSize: getResponsiveSize(15),
                    lineHeight: getResponsiveSize(20),
                  }}
                >
                  Registro de Clientes
                </Text>
              </View>
              <View
                className="w-full items-center justify-start mt-1"
                style={{ minHeight: getResponsiveSize(28) }}
              >
                <Text
                  className="font-roboto text-gray-500 text-center"
                  style={{ fontSize: getResponsiveSize(12) }}
                >
                  Clientes de la empresa
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white border border-gray-200 items-center justify-start shadow-sm active:opacity-80"
              style={{
                borderRadius: getResponsiveSize(20),
                paddingVertical: getResponsiveSize(24),
                paddingHorizontal: getResponsiveSize(12),
                elevation: 2,
              }}
              onPress={() => handleNavigate("/location", "Pinturas Berel")}
            >
              <View
                className="bg-[#EB0029] overflow-hidden items-center justify-center mb-4 shadow-sm"
                style={{
                  width: getResponsiveSize(96),
                  height: getResponsiveSize(96),
                  borderRadius: getResponsiveSize(22),
                  elevation: 3,
                }}
              >
                <Image
                  source={require("../assets/images/berel.png")}
                  style={{ width: "100%", height: "100%" }}
                  resizeMode="cover"
                />
              </View>
              <View
                className="w-full items-center justify-center"
                style={{ minHeight: getResponsiveSize(42) }}
              >
                <Text
                  className="font-poppins-bold text-gray-800 text-center"
                  style={{
                    fontSize: getResponsiveSize(15),
                    lineHeight: getResponsiveSize(20),
                  }}
                >
                  Pinturas Berel
                </Text>
              </View>
              <View
                className="w-full items-center justify-start mt-1"
                style={{ minHeight: getResponsiveSize(28) }}
              >
                <Text
                  className="font-roboto text-gray-500 text-center"
                  style={{ fontSize: getResponsiveSize(12) }}
                >
                  Ubicación de tiendas
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View
        className="items-center justify-center"
        style={{ paddingBottom: getResponsiveSize(10) }}
      >
        <Text
          className="font-roboto-medium text-slate-400 text-center"
          style={{
            fontSize: getResponsiveSize(11),
            letterSpacing: 0.5,
          }}
        >
          v{appVersion}
        </Text>
      </View>
    </SafeAreaView>
  );
}

