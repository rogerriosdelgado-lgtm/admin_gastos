import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const GEMINI_KEY_STORAGE = 'admin_gastos_gemini_api_key';

export interface ScannedItem {
  descripcion: string;
  precio: number;
}

export interface ScannedReceiptResult {
  comercio?: string;
  total?: number;
  items: ScannedItem[];
}

export const getGeminiApiKey = async (): Promise<string | null> => {
  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
    return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  }
  try {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? window.localStorage.getItem(GEMINI_KEY_STORAGE) : null;
    }
    return await SecureStore.getItemAsync(GEMINI_KEY_STORAGE);
  } catch {
    return null;
  }
};

export const saveGeminiApiKey = async (key: string): Promise<boolean> => {
  try {
    const cleanKey = key.trim();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(GEMINI_KEY_STORAGE, cleanKey);
      }
      return true;
    }
    await SecureStore.setItemAsync(GEMINI_KEY_STORAGE, cleanKey);
    return true;
  } catch {
    return false;
  }
};

export const removeGeminiApiKey = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(GEMINI_KEY_STORAGE);
      }
      return true;
    }
    await SecureStore.deleteItemAsync(GEMINI_KEY_STORAGE);
    return true;
  } catch {
    return false;
  }
};

export const parseReceiptWithGemini = async (
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<{ success: boolean; data?: ScannedReceiptResult; error?: string }> => {
  const apiKey = await getGeminiApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: 'MISSING_KEY',
    };
  }

  // Modelos compatibles en orden de preferencia
  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];

  const promptText = `
Sos un asistente contable y de gastos para escanear tickets, cuentas de bar/restaurante o comprobantes de compra.
Tu tarea es analizar minuciosamente la imagen del ticket y extraer:
1. El nombre del comercio o local si está visible.
2. Cada uno de los ítems, comidas, bebidas o productos con su descripción y el precio final correspondiente.
3. El total general del ticket.

Reglas:
- Si un precio tiene puntos de miles (ej: 23.800) o signos pesos ($), conviértelo a un número limpio (ej: 23800).
- Si la imagen está un poco borrosa o un nombre no se distingue bien, coloca la mejor aproximación posible (ej: "Bebida (estimada)" o "Plato 1").
- No incluyas propina sugerida ni líneas de descuento como si fueran productos consumidos.
- Si hay cantidades (ej: "2 Latas Cerv. $10.500"), el precio debe ser el total de esa línea (10500).
- Devuelve única y estrictamente un objeto JSON con las claves: "comercio", "total", "items" (array de objetos con "descripcion" y "precio").
`.trim();

  const requestBody = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: mimeType,
              data: base64Image,
            },
          },
          {
            text: promptText,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          comercio: { type: 'STRING' },
          total: { type: 'NUMBER' },
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                descripcion: { type: 'STRING' },
                precio: { type: 'NUMBER' },
              },
              required: ['descripcion', 'precio'],
            },
          },
        },
        required: ['items'],
      },
    },
  };

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.warn(`Intento con ${model} falló (${response.status}):`, errorData);
        // Si es 404 de modelo, probar el siguiente
        if (response.status === 404) {
          continue;
        }
        return {
          success: false,
          error: errorData.error?.message || `Error del servidor (${response.status})`,
        };
      }

      const jsonResponse = await response.json();
      const rawText = jsonResponse.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return {
          success: false,
          error: 'La IA no devolvió texto analizable para esta imagen.',
        };
      }

      const parsed: ScannedReceiptResult = JSON.parse(rawText);

      // Limpieza y validación de tipos
      const cleanedItems = (parsed.items || []).map((item) => ({
        descripcion: String(item.descripcion || 'Ítem sin nombre').trim(),
        precio: Math.max(0, Number(item.precio) || 0),
      }));

      return {
        success: true,
        data: {
          comercio: parsed.comercio?.trim() || undefined,
          total: Number(parsed.total) || undefined,
          items: cleanedItems,
        },
      };
    } catch (err: unknown) {
      console.warn(`Error llamando a Gemini (${model}):`, err);
    }
  }

  return {
    success: false,
    error: 'No se pudo conectar con el servicio de IA. Verifica tu conexión y tu clave de API.',
  };
};
