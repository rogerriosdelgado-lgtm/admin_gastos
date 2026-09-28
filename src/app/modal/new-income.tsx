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
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { TipoIngreso } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';

export default function NewIncomeModal() {
  const { addIngreso, refreshData } = useFinance();
  const [monto, setMonto] = useState('');
  const [concepto, setConcepto] = useState('');
  const [tipo, setTipo] = useState<TipoIngreso>('sueldo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const montoNum = parseFloat(monto.replace(',', '.'));
    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto válido');
      return;
    }
    const conceptoFinal = concepto.trim() || (tipo === 'sueldo' ? 'Sueldo Mensual' : 'Ingreso Extra');

    setIsSubmitting(true);
    try {
      await addIngreso(montoNum, conceptoFinal, tipo);
      await refreshData();
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el ingreso');
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
          <Text style={styles.headerTitle}>Agregar Ingreso / Sueldo</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Monto */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#CBD5E1"
              keyboardType="numeric"
              value={monto}
              onChangeText={setMonto}
              autoFocus
            />
          </View>

          {/* Tipo de Ingreso */}
          <Text style={styles.label}>Tipo de Ingreso</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, tipo === 'sueldo' && styles.typeBtnActive]}
              onPress={() => setTipo('sueldo')}
            >
              <Ionicons
                name="briefcase"
                size={18}
                color={tipo === 'sueldo' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.typeText, tipo === 'sueldo' && styles.typeTextActive]}>
                Sueldo Mensual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, tipo === 'extra' && styles.typeBtnActive]}
              onPress={() => setTipo('extra')}
            >
              <Ionicons
                name="sparkles"
                size={18}
                color={tipo === 'extra' ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.typeText, tipo === 'extra' && styles.typeTextActive]}>
                Ingreso Extra
              </Text>
            </TouchableOpacity>
          </View>

          {/* Concepto */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Concepto (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder={tipo === 'sueldo' ? 'Ej: Salario Empresa' : 'Ej: Venta, Freelance, Bono'}
              placeholderTextColor="#94A3B8"
              value={concepto}
              onChangeText={setConcepto}
            />
          </View>

          {/* Botón */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.saveBtnText}>
              {isSubmitting ? 'Guardando...' : 'Registrar Ingreso'}
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
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  currencyPrefix: {
    fontSize: 36,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0F172A',
    minWidth: 140,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  typeBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  typeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  typeTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 24,
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
  saveBtn: {
    backgroundColor: '#059669',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
