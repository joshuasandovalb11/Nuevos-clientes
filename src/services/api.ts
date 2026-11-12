// src/services/api.ts
import Constants from "expo-constants";
import { getSessionToken } from "../utils/storage";

const PROD_URL = process.env.EXPO_PUBLIC_API_URL || "https://backend-email-murex.vercel.app/api";
const APP_SECRET = process.env.EXPO_PUBLIC_APP_SECRET || "TME-Secret-2026";

// Obtener la IP dinámica de la computadora a través de Expo Metro
const getDynamicLocalUrl = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost ||
    (Constants as any).manifest?.debuggerHost;

  if (!hostUri) return null;
  const hostIp = hostUri.split(":")[0];
  if (!hostIp) return null;
  return `http://${hostIp}:3000/api`;
};

let activeBaseUrl: string | null = null;
let resolvePromise: Promise<string> | null = null;

export const getBaseUrl = async (): Promise<string> => {
  // 1. En producción (APK final), siempre apunta a Vercel directamente
  if (!__DEV__) {
    return PROD_URL;
  }

  // 2. Si ya se resolvió la URL activa en esta sesión, devolverla de inmediato
  if (activeBaseUrl) {
    return activeBaseUrl;
  }

  if (resolvePromise) {
    return resolvePromise;
  }

  resolvePromise = (async () => {
    const localUrl = getDynamicLocalUrl();
    if (!localUrl) {
      activeBaseUrl = PROD_URL;
      return PROD_URL;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      await fetch(localUrl, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      activeBaseUrl = localUrl;
      console.log(`[API] 🚀 Backend local activo: ${localUrl}`);
      return localUrl;
    } catch {
      activeBaseUrl = PROD_URL;
      console.log(`[API] 🌐 Backend local inactivo/inalcanzable. Usando Vercel: ${PROD_URL}`);
      return PROD_URL;
    } finally {
      resolvePromise = null;
    }
  })();

  return resolvePromise;
};

const fetchWithTimeout = async (path: string, options: RequestInit = {}, timeout = 15000) => {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers = {
    ...options.headers,
    "x-app-secret": APP_SECRET,
  };

  const fetchPromise = fetch(url, { ...options, headers });

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new Error("TIMEOUT")), timeout);
  });

  try {
    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error: any) {
    // Si falló el backend local (por ejemplo se apagó o se desconectó la red), reintentar con Vercel
    if (__DEV__ && baseUrl !== PROD_URL) {
      console.warn(`[API] ⚠️ Error en backend local (${url}). Reintentando automáticamente con Vercel...`);
      activeBaseUrl = PROD_URL;
      const fallbackUrl = `${PROD_URL}${path}`;
      try {
        const fallbackFetch = fetch(fallbackUrl, { ...options, headers });
        const fallbackTimeout = new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), timeout)
        );
        return await Promise.race([fallbackFetch, fallbackTimeout]);
      } catch (fallbackErr: any) {
        if (fallbackErr.message === "TIMEOUT") {
          throw new Error("Conexión a internet lenta o inestable. Intenta de nuevo.");
        }
        throw new Error("Error de red. Verifica tu conexión a internet.");
      }
    }

    if (error.message === "TIMEOUT") {
      throw new Error("Conexión a internet lenta o inestable. Intenta de nuevo.");
    }
    throw new Error("Error de red. Verifica tu conexión a internet.");
  }
};

export const requestSms = async (telefono: string, idApp: number) => {
  const response = await fetchWithTimeout(`/request-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono, id_app: idApp }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Error al solicitar SMS.");
  }
  return result;
};

export const verifyPin = async (telefono: string, idApp: number, pin: string, deviceUuid: string, deviceModel: string) => {
  const response = await fetchWithTimeout(`/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono, id_app: idApp, pin, device_uuid: deviceUuid, device_model: deviceModel }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "PIN incorrecto o dispositivo bloqueado.");
  }
  return result;
};

export const resendSms = async (telefono: string) => {
  const response = await fetchWithTimeout(`/resend-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Error al reenviar SMS.");
  }
  return result;
};

export const resetSms = async (telefono: string) => {
  const response = await fetchWithTimeout(`/reset-sms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telefono }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Error al reiniciar el proceso OTP.");
  }
  return result;
};

export interface RegisterClientPayload {
  type?: "CLIENT" | "LOCATION";
  client_number?: string;
  client_name?: string;
  client_phone?: string;
  place_category?: string;
  photo_base64?: string;
  latitude?: number;
  longitude?: number;
  salesperson_name: string;
  salesperson_phone: string;
}

export const registerClient = async (payload: RegisterClientPayload) => {
  const token = await getSessionToken();
  const response = await fetchWithTimeout(`/send-mail`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("AUTH_ERROR");
    }
    throw new Error(result.error || "Ocurrió un error en el servidor.");
  }
  return result;
};
