import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function SettleDebtModal() {
  const params = useLocalSearchParams<{
    persona?: string;
    monto?: string;
    tePagaATi?: string;
  }>();

  const { profile } = useAuth();
  const { addLiquidacion, refreshData, participantes } = useFinance();

  const miNombre = profile?.nombre || 'Yo';
  const [persona, setPersona] = useState(params.persona || '');
  const [monto, setMonto] = useState(params.monto || '');
  const [tePagaATi, setTePagaATi] = useState(params.tePagaATi !== 'false');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const montoNum = parseFloat(monto.replace(',', '.'));
    if (!persona.trim()) {
      Alert.alert('Falta persona', 'Indica el nombre de la persona con quien saldas');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un valor positivo');
      return;
    }

    setIsSubmitting(true);
    try {
      const deNombre = tePagaATi ? persona.trim() : miNombre;
      const paraNombre = tePagaATi ? miNombre : persona.trim();

      await addLiquidacion(
        deNombre,
        paraNombre,
        montoNum,
        `Liquidación entre ${deNombre} y ${paraNombre}`
      );
      await refreshData();
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo registrar la liquidación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Saldar Cuentas</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-done" size={36} color="#10B981" />
          </View>
          <Text style={styles.desc}>
            Registra un pago en efectivo o transferencia para dejar las deudas al día.
          </Text>

          {/* Dirección del pago */}
          <Text style={styles.label}>Dirección del Pago</Text>
          <View style={styles.directionRow}>
            <TouchableOpacity
              style={[styles.directionBtn, tePagaATi && styles.directionBtnActive]}
              onPress={() => setTePagaATi(true)}
            >
              <Ionicons
                name="arrow-down-circle"
                size={18}
                color={tePagaATi ? '#FFFFFF' : '#059669'}
              />
              <Text style={[styles.directionText, tePagaATi && styles.directionTextActive]}>
                Me pagan a mí
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.directionBtn, !tePagaATi && styles.directionBtnActive]}
              onPress={() => setTePagaATi(false)}
            >
              <Ionicons
                name="arrow-up-circle"
                size={18}
                color={!tePagaATi ? '#FFFFFF' : '#2563EB'}
              />
              <Text style={[styles.directionText, !tePagaATi && styles.directionTextActive]}>
                Yo pago / transfiero
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre de la otra persona */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {tePagaATi ? '¿Quién te pagó?' : '¿A quién le pagaste?'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la persona"
              placeholderTextColor="#94A3B8"
              value={persona}
              onChangeText={setPersona}
            />

            {/* Chips rápidos de contactos existentes */}
            {participantes.length > 0 && (
              <View style={styles.chipsRow}>
                {participantes.map((part) => (
                  <TouchableOpacity
                    key={part.id}
                    style={[
                      styles.chip,
                      persona.toLowerCase() === part.nombre.toLowerCase() && styles.chipActive,
                    ]}
                    onPress={() => setPersona(part.nombre)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        persona.toLowerCase() === part.nombre.toLowerCase() && styles.chipTextActive,
                      ]}
                    >
                      {part.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Monto pagado */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Monto Transferido / Pagado</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={monto}
                onChangeText={setMonto}
              />
            </View>
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.saveBtnText}>
              {isSubmitting ? 'Registrando...' : 'Confirmar y Saldar Cuenta'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
  },
  content: {
    padding: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  desc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  directionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  directionBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  directionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  directionTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 18,
  },
  input: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  chipActive: {
    backgroundColor: '#2563EB',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  saveBtn: {
    backgroundColor: '#10B981',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
