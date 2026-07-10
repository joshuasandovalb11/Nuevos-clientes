// const BASE_URL = "https://backend-email-murex.vercel.app/api";
import { getSessionToken } from "../utils/storage";
const BASE_URL = "http://192.168.1.126:3000/api";
const APP_SECRET = "TME-Secret-2026";

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 15000) => {
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
    if (error.message === "TIMEOUT") {
      throw new Error("Conexión a internet lenta o inestable. Intenta de nuevo.");
    }
    throw new Error("Error de red. Verifica tu conexión a internet.");
  }
};

export const requestSms = async (telefono: string, idApp: number) => {
  const response = await fetchWithTimeout(`${BASE_URL}/request-sms`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/verify-pin`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/resend-sms`, {
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
  const response = await fetchWithTimeout(`${BASE_URL}/reset-sms`, {
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
  client_number: string;
  client_name: string;
  client_phone?: string;
  latitude?: number;
  longitude?: number;
  salesperson_name: string;
  salesperson_phone: string;
}

export const registerClient = async (payload: RegisterClientPayload) => {
  const token = await getSessionToken();
  const response = await fetchWithTimeout(`${BASE_URL}/send-mail`, {
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
