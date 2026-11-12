import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Animated, StyleProp, Text, useAnimatedValue, View, ViewStyle } from "react-native";
import { getResponsiveSize } from "../../utils/helpers";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number | `${number}%`;
  borderRadius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width,
  height,
  borderRadius = 8,
  className = "bg-gray-200",
  style,
  children,
}) => {
  const pulseAnim = useAnimatedValue(0.45);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      className={className}
      style={[
        {
          width,
          height,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

interface MediaSkeletonProps {
  height?: number;
  icon?: "map-pin" | "camera" | "image";
  label?: string;
}

/**
 * Esqueleto unificado con las mismas dimensiones exactas de las tarjetas
 * de Mapa (Ubicación) y Fotografía (Fachada), evitando saltos de interfaz.
 * Puede usarse limpio (<MediaCardSkeleton />) o con icono/texto opcionales.
 */
export const MediaCardSkeleton: React.FC<MediaSkeletonProps> = ({
  height = getResponsiveSize(180),
  icon,
  label,
}) => {
  return (
    <View
      className="w-full border border-gray-200 overflow-hidden bg-white"
      style={{ borderRadius: getResponsiveSize(12) }}
    >
      {/* Área principal del recurso (Mapa o Imagen) */}
      <View
        className="w-full bg-gray-100 items-center justify-center relative overflow-hidden"
        style={{ height }}
      >
        <SkeletonBox
          width="100%"
          height="100%"
          borderRadius={0}
          className="bg-gray-200/80 absolute inset-0"
        />
        {(icon || label) && (
          <View className="items-center justify-center z-10 px-4">
            {icon && (
              <View
                className="bg-white/90 rounded-full items-center justify-center mb-2 shadow-sm"
                style={{
                  width: getResponsiveSize(44),
                  height: getResponsiveSize(44),
                }}
              >
                <Feather name={icon} size={20} color="#3B82F6" />
              </View>
            )}
            {label && (
              <Text
                className="font-roboto-medium text-gray-600 text-center"
                style={{ fontSize: getResponsiveSize(12) }}
              >
                {label}
              </Text>
            )}
          </View>
        )}

        {/* Píldora flotante inferior derecha simulada */}
        <SkeletonBox
          width={getResponsiveSize(115)}
          height={getResponsiveSize(24)}
          borderRadius={getResponsiveSize(8)}
          className="bg-gray-300/90 absolute bottom-2.5 right-2.5"
        />
      </View>

      {/* Barra inferior de estado y acciones simulada */}
      <View className="flex-row items-center justify-between bg-gray-50 px-3 py-2.5 border-t border-gray-200">
        <View className="flex-row items-center">
          <SkeletonBox
            width={getResponsiveSize(15)}
            height={getResponsiveSize(15)}
            borderRadius={getResponsiveSize(8)}
            className="bg-gray-300"
          />
          <SkeletonBox
            width={getResponsiveSize(92)}
            height={getResponsiveSize(14)}
            borderRadius={getResponsiveSize(4)}
            className="bg-gray-300 ml-2"
          />
        </View>
        <View
          className="flex-row items-center"
          style={{ gap: getResponsiveSize(8) }}
        >
          <SkeletonBox
            width={getResponsiveSize(68)}
            height={getResponsiveSize(24)}
            borderRadius={getResponsiveSize(6)}
            className="bg-gray-300"
          />
        </View>
      </View>
    </View>
  );
};

/**
 * Esqueleto de carga inicial para la sesión de la aplicación.
 */
export const AppSessionSkeleton: React.FC = () => {
  return (
    <View
      className="flex-1 bg-[#F8FAFC] justify-center items-center"
      style={{ paddingHorizontal: getResponsiveSize(20) }}
    >
      <View className="w-full max-w-[500px] items-center">
        <SkeletonBox
          width={getResponsiveSize(180)}
          height={getResponsiveSize(28)}
          borderRadius={getResponsiveSize(8)}
          className="bg-gray-200 mb-2"
        />
        <SkeletonBox
          width={getResponsiveSize(240)}
          height={getResponsiveSize(16)}
          borderRadius={getResponsiveSize(6)}
          className="bg-gray-200 mb-8"
        />
        <View
          className="w-full flex-row justify-between"
          style={{ gap: getResponsiveSize(16) }}
        >
          <View
            className="flex-1 bg-white border border-gray-200 items-center"
            style={{
              borderRadius: getResponsiveSize(20),
              paddingVertical: getResponsiveSize(24),
              paddingHorizontal: getResponsiveSize(12),
            }}
          >
            <SkeletonBox
              width={getResponsiveSize(96)}
              height={getResponsiveSize(96)}
              borderRadius={getResponsiveSize(22)}
              className="bg-gray-200 mb-4"
            />
            <SkeletonBox
              width="80%"
              height={getResponsiveSize(18)}
              borderRadius={getResponsiveSize(6)}
              className="bg-gray-200 mb-2"
            />
            <SkeletonBox
              width="60%"
              height={getResponsiveSize(12)}
              borderRadius={getResponsiveSize(4)}
              className="bg-gray-200"
            />
          </View>
          <View
            className="flex-1 bg-white border border-gray-200 items-center"
            style={{
              borderRadius: getResponsiveSize(20),
              paddingVertical: getResponsiveSize(24),
              paddingHorizontal: getResponsiveSize(12),
            }}
          >
            <SkeletonBox
              width={getResponsiveSize(96)}
              height={getResponsiveSize(96)}
              borderRadius={getResponsiveSize(22)}
              className="bg-gray-200 mb-4"
            />
            <SkeletonBox
              width="80%"
              height={getResponsiveSize(18)}
              borderRadius={getResponsiveSize(6)}
              className="bg-gray-200 mb-2"
            />
            <SkeletonBox
              width="60%"
              height={getResponsiveSize(12)}
              borderRadius={getResponsiveSize(4)}
              className="bg-gray-200"
            />
          </View>
        </View>
      </View>
    </View>
  );
};
