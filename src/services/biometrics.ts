import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const PIN_STORE_KEY = 'admin_gastos_user_pin';
const BIOMETRICS_PREF_KEY = 'admin_gastos_biometrics_pref';

export interface BiometricsStatus {
  hasHardware: boolean;
  isEnrolled: boolean;
  biometryType: string;
}

export const checkBiometricsSupport = async (): Promise<BiometricsStatus> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometryType = 'Huella dactilar';
    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometryType = 'Face ID / Reconocimiento facial';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometryType = 'Huella dactilar';
    }

    return {
      hasHardware,
      isEnrolled,
      biometryType,
    };
  } catch (error) {
    return {
      hasHardware: false,
      isEnrolled: false,
      biometryType: 'No disponible',
    };
  }
};

export const promptBiometricAuth = async (
  promptMessage: string = 'Autentícate para acceder a tus gastos'
): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Usar PIN / Contraseña',
      fallbackLabel: 'Ingresar PIN',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch (error) {
    return false;
  }
};

export const saveUserPin = async (pin: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(PIN_STORE_KEY, pin);
    return true;
  } catch {
    return false;
  }
};

export const verifyUserPin = async (pin: string): Promise<boolean> => {
  try {
    const storedPin = await SecureStore.getItemAsync(PIN_STORE_KEY);
    return storedPin !== null && storedPin === pin;
  } catch {
    return false;
  }
};

export const hasConfiguredPin = async (): Promise<boolean> => {
  try {
    const pin = await SecureStore.getItemAsync(PIN_STORE_KEY);
    return Boolean(pin);
  } catch {
    return false;
  }
};

export const setBiometricsPreference = async (enabled: boolean): Promise<void> => {
  try {
    await SecureStore.setItemAsync(BIOMETRICS_PREF_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore error
  }
};

export const getBiometricsPreference = async (): Promise<boolean> => {
  try {
    const pref = await SecureStore.getItemAsync(BIOMETRICS_PREF_KEY);
    // Por defecto activada si no se configuró expresamente
    return pref === null || pref === 'true';
  } catch {
    return true;
  }
};
