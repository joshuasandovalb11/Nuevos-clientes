const BASE_URL = "https://backend-email-murex.vercel.app/api";

export const verifyUser = async (userPhoneNumber: string) => {
  const response = await fetch(`${BASE_URL}/verify-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_phone_number: userPhoneNumber }),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Este número no tiene permiso.");
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
  const response = await fetch(`${BASE_URL}/send-mail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "Ocurrió un error en el servidor.");
  }
  return result;
};
