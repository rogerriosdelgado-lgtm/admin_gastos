import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function UnlockScreen() {
  const {
    profile,
    unlockWithBiometrics,
    unlockWithPin,
    biometricsSupported,
    biometryType,
    hasPin,
    logout,
  } = useAuth();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAttempting, setIsAttempting] = useState(false);

  // Intentar desbloqueo biométrico automático al cargar la pantalla
  useEffect(() => {
    let isMounted = true;
    const autoPrompt = async () => {
      if (biometricsSupported) {
        setIsAttempting(true);
        const success = await unlockWithBiometrics();
        if (isMounted) {
          setIsAttempting(false);
          if (success) {
            router.replace('/(tabs)');
          }
        }
      }
    };

    autoPrompt();
    return () => {
      isMounted = false;
    };
  }, [biometricsSupported]);

  const handleManualBiometric = async () => {
    setErrorMsg(null);
    setIsAttempting(true);
    const success = await unlockWithBiometrics();
    setIsAttempting(false);
    if (success) {
      router.replace('/(tabs)');
    } else {
      setErrorMsg('No se reconoció la huella. Usa tu PIN.');
    }
  };

  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setErrorMsg('El PIN debe tener 4 dígitos');
      return;
    }
    setErrorMsg(null);
    const valid = await unlockWithPin(pin);
    if (valid) {
      router.replace('/(tabs)');
    } else {
      setErrorMsg('PIN incorrecto. Intenta de nuevo.');
      setPin('');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const nombreUsuario = profile?.nombre || 'Usuario';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* User header */}
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarInitial}>{nombreUsuario.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.welcomeText}>¡Hola de nuevo, {nombreUsuario}!</Text>
        <Text style={styles.promptText}>Desbloquea la app para ver tus finanzas</Text>

        {/* Biometrics button */}
        {biometricsSupported && (
          <TouchableOpacity
            style={styles.bioButton}
            onPress={handleManualBiometric}
            disabled={isAttempting}
          >
            <View style={styles.bioIconCircle}>
              {isAttempting ? (
                <ActivityIndicator color="#2563EB" size="large" />
              ) : (
                <Ionicons name="finger-print" size={54} color="#2563EB" />
              )}
            </View>
            <Text style={styles.bioButtonText}>Toca para ingresar con {biometryType}</Text>
          </TouchableOpacity>
        )}

        {/* Error message */}
        {errorMsg && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#DC2626" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* PIN fallback */}
        {hasPin && (
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>O ingresa tu PIN de 4 dígitos:</Text>
            <View style={styles.pinRow}>
              <TextInput
                style={styles.pinInput}
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
                value={pin}
                onChangeText={(val) => {
                  const cleaned = val.replace(/[^0-9]/g, '').slice(0, 4);
                  setPin(cleaned);
                  if (cleaned.length === 4) {
                    setErrorMsg(null);
                  }
                }}
                secureTextEntry
              />
              <TouchableOpacity
                style={[styles.pinConfirmBtn, pin.length !== 4 && styles.btnDisabled]}
                onPress={handlePinSubmit}
                disabled={pin.length !== 4}
              >
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer actions */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.logoutText}>Cerrar sesión o cambiar de cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  promptText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 32,
  },
  bioButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bioIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bioButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    maxWidth: '90%',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  pinSection: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
    marginTop: 10,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  pinInput: {
    flex: 1,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
    color: '#0F172A',
  },
  pinConfirmBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
  },
  logoutText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
