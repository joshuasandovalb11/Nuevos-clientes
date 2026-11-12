import * as SplashScreen from "expo-splash-screen";
import { usePathname } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet, Text, useAnimatedValue, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SplashContextValue {
  markAppReady: () => void;
}

const SplashContext = createContext<SplashContextValue>({
  markAppReady: () => {},
});

export const useSplash = () => useContext(SplashContext);

interface AnimatedSplashOverlayProps {
  isAppReady: boolean;
  onFinish: () => void;
}

const MIN_SPLASH_MS = 950;
const LOGO_SIZE = 200; // Coincide exactamente con imageWidth: 200 en app.config.js

const AnimatedSplashOverlay: React.FC<AnimatedSplashOverlayProps> = ({
  isAppReady,
  onFinish,
}) => {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const mountedAtRef = useRef<number | null>(null);
  const hasHiddenNativeRef = useRef(false);
  const hasStartedExitRef = useRef(false);

  const [displayPercent, setDisplayPercent] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const progressAnim = useAnimatedValue(0);
  const shimmerAnim = useAnimatedValue(-1);
  const pillOpacity = useAnimatedValue(0);
  const pillTranslateY = useAnimatedValue(8);
  const overlayOpacity = useAnimatedValue(1);
  const exitScale = useAnimatedValue(1);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  const hideNativeSplashSafely = useCallback(() => {
    if (hasHiddenNativeRef.current) return;
    hasHiddenNativeRef.current = true;
    requestAnimationFrame(() => {
      SplashScreen.hideAsync().catch(() => {});
    });
  }, []);

  // Si se abre directo en otra ruta (p.ej. recarga rápida en desarrollo), no bloquear
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      hideNativeSplashSafely();
    }, 350);
    return () => clearTimeout(fallbackTimer);
  }, [hideNativeSplashSafely]);

  // Escuchar progreso numérico tabular (0% -> 100%)
  useEffect(() => {
    const listenerId = progressAnim.addListener(({ value }) => {
      const pct = Math.min(100, Math.max(0, Math.round(value * 100)));
      setDisplayPercent((prev) => (prev === pct ? prev : pct));
    });
    return () => {
      progressAnim.removeListener(listenerId);
    };
  }, [progressAnim]);

  // Fase inicial de animaciones (entrada sutil del indicador + barrido de brillo dorado)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(pillOpacity, {
        toValue: 1,
        duration: 280,
        delay: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(pillTranslateY, {
        toValue: 0,
        duration: 280,
        delay: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0.78,
        duration: 820,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(140),
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 860,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(350),
      ])
    );
    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [pillOpacity, pillTranslateY, progressAnim, shimmerAnim]);

  // Completar al 100% y desvanecer suavemente cuando la app esté lista
  useEffect(() => {
    const readyNow = isAppReady || pathname !== "/";
    if (!readyNow || hasStartedExitRef.current) return;

    const mountedAt = mountedAtRef.current ?? Date.now();
    const elapsed = Date.now() - mountedAt;
    const waitMs = Math.max(0, MIN_SPLASH_MS - elapsed);

    const completeTimer = setTimeout(() => {
      if (hasStartedExitRef.current) return;
      hasStartedExitRef.current = true;

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      }).start(() => {
        setTimeout(() => {
          setIsFadingOut(true);
          Animated.parallel([
            Animated.timing(overlayOpacity, {
              toValue: 0,
              duration: 280,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(exitScale, {
              toValue: 1.025,
              duration: 280,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(() => {
            onFinish();
          });
        }, 110);
      });
    }, waitMs);

    return () => clearTimeout(completeTimer);
  }, [exitScale, isAppReady, onFinish, overlayOpacity, pathname, progressAnim]);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-185, 185],
  });

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["4%", "100%"],
  });

  const barGlowTranslateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-70, 180],
  });

  return (
    <Animated.View
      pointerEvents={isFadingOut ? "none" : "auto"}
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 9999,
          elevation: 9999,
          backgroundColor: "#FFFFFF",
          justifyContent: "center",
          alignItems: "center",
          opacity: overlayOpacity,
        },
      ]}
    >
      {/* Emblema centrado exactamente a 200x200 dp igual que el Splash Nativo */}
      <Animated.View
        style={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          transform: [{ scale: exitScale }],
        }}
      >
        <Image
          source={require("../../../assets/images/splash-icon.png")}
          style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
          resizeMode="contain"
          onLoadEnd={hideNativeSplashSafely}
        />

        {/* Destello diagonal: blanco translúcido es invisible sobre fondo #FFFFFF y brilla solo sobre el logo */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -40,
            bottom: -40,
            width: 68,
            justifyContent: "center",
            alignItems: "center",
            transform: [
              { translateX: shimmerTranslateX },
              { rotate: "-24deg" },
            ],
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 64,
              backgroundColor: "rgba(255, 255, 255, 0.14)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 34,
              backgroundColor: "rgba(255, 255, 255, 0.26)",
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              width: 12,
              backgroundColor: "rgba(255, 255, 255, 0.40)",
            }}
          />
        </Animated.View>
      </Animated.View>

      {/* Cápsula de progreso dorada y porcentaje tabular (sin nombre de app) */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: Math.max(insets.bottom, 24) + 38,
          left: 0,
          right: 0,
          alignItems: "center",
          opacity: pillOpacity,
          transform: [{ translateY: pillTranslateY }],
        }}
      >
        <View
          style={{
            width: 176,
            height: 8,
            borderRadius: 999,
            backgroundColor: "#FEF3C7",
            borderWidth: 1,
            borderColor: "rgba(245, 158, 11, 0.35)",
            padding: 1.5,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              width: barWidth,
              height: "100%",
              borderRadius: 999,
              backgroundColor: "#F59E0B",
              overflow: "hidden",
            }}
          >
            {/* Reflejo superior para dar profundidad dorada */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1.5,
                backgroundColor: "rgba(254, 243, 199, 0.75)",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 1.5,
                backgroundColor: "rgba(217, 119, 6, 0.45)",
              }}
            />
            {/* Brillo viajero sobre la barra */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 32,
                backgroundColor: "rgba(255, 255, 255, 0.38)",
                transform: [{ translateX: barGlowTranslateX }],
              }}
            />
          </Animated.View>
        </View>

        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            fontFamily: "Roboto_500Medium",
            color: "#B45309",
            fontVariant: ["tabular-nums"],
            letterSpacing: 0.4,
          }}
        >
          {displayPercent}%
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

interface SplashProviderProps {
  children: React.ReactNode;
}

export const SplashProvider: React.FC<SplashProviderProps> = ({ children }) => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const markAppReady = useCallback(() => {
    setIsAppReady(true);
  }, []);

  // Red de seguridad en caso de que la pantalla inicial demore demasiado
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsAppReady(true);
    }, 3000);
    return () => clearTimeout(safetyTimer);
  }, []);

  return (
    <SplashContext.Provider value={{ markAppReady }}>
      {children}
      {showOverlay && (
        <AnimatedSplashOverlay
          isAppReady={isAppReady}
          onFinish={() => setShowOverlay(false)}
        />
      )}
    </SplashContext.Provider>
  );
};
