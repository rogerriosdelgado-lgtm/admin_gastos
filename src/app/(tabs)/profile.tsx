import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import {
  saveUserPin,
  setBiometricsPreference,
  getBiometricsPreference,
} from '../../services/biometrics';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { profile, logout, lockApp, biometricsSupported, biometryType } = useAuth();
  const { addIngreso, refreshData } = useFinance();

  const [biometricsActive, setBiometricsActive] = useState(true);
  const [nuevoPin, setNuevoPin] = useState('');
  const [mostrarPinInput, setMostrarPinInput] = useState(false);
  const [sueldoBase, setSueldoBase] = useState('');

  React.useEffect(() => {
    getBiometricsPreference().then(setBiometricsActive);
  }, []);

  const handleToggleBiometrics = async (val: boolean) => {
    setBiometricsActive(val);
    await setBiometricsPreference(val);
  };

  const handleGuardarPin = async () => {
    if (nuevoPin.length !== 4) {
      Alert.alert('Error', 'El PIN debe contener exactamente 4 números');
      return;
    }
    const success = await saveUserPin(nuevoPin);
    if (success) {
      Alert.alert('Éxito', 'Tu nuevo PIN ha sido guardado correctamente');
      setNuevoPin('');
      setMostrarPinInput(false);
    }
  };

  const handleGuardarSueldo = async () => {
    const monto = parseFloat(sueldoBase.replace(',', '.'));
    if (isNaN(monto) || monto <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto válido para tu sueldo');
      return;
    }

    await addIngreso(monto, 'Sueldo Mensual Base', 'sueldo');
    await refreshData();
    setSueldoBase('');
    Alert.alert('Sueldo registrado', 'Tu sueldo base mensual ha sido actualizado');
  };

  const handleBloquearApp = () => {
    lockApp();
    router.replace('/(auth)/unlock');
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir de tu cuenta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil y Ajustes</Text>
        </View>

        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBig}>
            <Text style={styles.avatarLetter}>
              {(profile?.nombre || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.userName}>{profile?.nombre || 'Usuario'}</Text>
            <Text style={styles.userEmail}>{profile?.email || 'Sin correo asociado'}</Text>
            <View style={styles.statusBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.statusText}>Sincronizado con Supabase</Text>
            </View>
          </View>
        </View>

        {/* Configurar Sueldo Mensual */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionCardTitle}>Sueldo Mensual Base</Text>
          </View>
          <Text style={styles.sectionDesc}>
            Registra tu sueldo mensual para que el presupuesto se calcule automáticamente.
          </Text>

          <View style={styles.salaryInputRow}>
            <TextInput
              style={styles.salaryInput}
              placeholder="$ 0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={sueldoBase}
              onChangeText={setSueldoBase}
            />
            <TouchableOpacity style={styles.salarySaveBtn} onPress={handleGuardarSueldo}>
              <Text style={styles.salarySaveText}>Cargar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Seguridad y Biometría */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionCardTitle}>Seguridad y Bloqueo</Text>
          </View>

          {/* Biometría */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.settingLabel}>Ingreso con {biometryType}</Text>
              <Text style={styles.settingSub}>
                {biometricsSupported
                  ? 'Usa tu sensor biométrico al abrir la app'
                  : 'Sensor no disponible en este dispositivo'}
              </Text>
            </View>
            <Switch
              value={biometricsActive}
              onValueChange={handleToggleBiometrics}
              disabled={!biometricsSupported}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={biometricsActive ? '#2563EB' : '#F1F5F9'}
            />
          </View>

          {/* Cambiar PIN */}
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>PIN de Acceso Rápido</Text>
              <Text style={styles.settingSub}>Alternativa de 4 dígitos</Text>
            </View>
            <TouchableOpacity
              style={styles.actionPill}
              onPress={() => setMostrarPinInput(!mostrarPinInput)}
            >
              <Text style={styles.actionPillText}>
                {mostrarPinInput ? 'Cancelar' : 'Cambiar PIN'}
              </Text>
            </TouchableOpacity>
          </View>

          {mostrarPinInput && (
            <View style={styles.pinChangeBox}>
              <TextInput
                style={styles.pinChangeInput}
                placeholder="Nuevo PIN (4 dígitos)"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={4}
                value={nuevoPin}
                onChangeText={(val) => setNuevoPin(val.replace(/[^0-9]/g, ''))}
                secureTextEntry
              />
              <TouchableOpacity style={styles.pinChangeBtn} onPress={handleGuardarPin}>
                <Text style={styles.pinChangeBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bloquear Ahora */}
          <TouchableOpacity style={styles.lockNowBtn} onPress={handleBloquearApp}>
            <Ionicons name="lock-closed-outline" size={18} color="#475569" />
            <Text style={styles.lockNowText}>Bloquear app inmediatamente</Text>
          </TouchableOpacity>
        </View>

        {/* Cerrar Sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 14,
  },
  salaryInputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  salaryInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '700',
  },
  salarySaveBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  salarySaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  settingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  actionPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  pinChangeBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
  },
  pinChangeInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 4,
  },
  pinChangeBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinChangeBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  lockNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
});
