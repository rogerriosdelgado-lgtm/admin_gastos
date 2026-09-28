import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { CategoriaGasto } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';

export default function NewExpenseModal() {
  const { profile } = useAuth();
  const {
    addGastoPersonal,
    addGastoCompartidoSimple,
    participantes,
    addParticipante,
  } = useFinance();

  const [titulo, setTitulo] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('variable');
  const [esCompartido, setEsCompartido] = useState(false);
  const [yoPague, setYoPague] = useState(true);
  const [pagadorNombre, setPagadorNombre] = useState(profile?.nombre || 'Yo');
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);
  const [nuevoContacto, setNuevoContacto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleParticipante = (nombre: string) => {
    if (participantesSeleccionados.includes(nombre)) {
      setParticipantesSeleccionados(participantesSeleccionados.filter((n) => n !== nombre));
    } else {
      setParticipantesSeleccionados([...participantesSeleccionados, nombre]);
    }
  };

  const handleCrearContacto = async () => {
    if (!nuevoContacto.trim()) return;
    await addParticipante(nuevoContacto.trim());
    if (!participantesSeleccionados.includes(nuevoContacto.trim())) {
      setParticipantesSeleccionados([...participantesSeleccionados, nuevoContacto.trim()]);
    }
    setNuevoContacto('');
  };

  const handleSubmit = async () => {
    const montoNum = parseFloat(monto.replace(',', '.'));
    if (!titulo.trim()) {
      Alert.alert('Falta concepto', 'Por favor escribe el concepto o nombre del gasto');
      return;
    }
    if (isNaN(montoNum) || montoNum <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un valor mayor a cero');
      return;
    }

    setIsSubmitting(true);
    try {
      if (!esCompartido) {
        await addGastoPersonal(titulo.trim(), montoNum, categoria);
      } else {
        if (participantesSeleccionados.length === 0) {
          Alert.alert('Sin participantes', 'Selecciona al menos una persona con quien compartir');
          setIsSubmitting(false);
          return;
        }

        await addGastoCompartidoSimple(
          titulo.trim(),
          montoNum,
          categoria,
          yoPague,
          yoPague ? profile?.nombre || 'Yo' : pagadorNombre,
          participantesSeleccionados
        );
      }
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar el gasto');
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
          <Text style={styles.headerTitle}>Nuevo Gasto</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Monto Grande */}
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

          {/* Concepto / Título */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Concepto / Descripción</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Supermercado, Cine, Gasolina..."
              placeholderTextColor="#94A3B8"
              value={titulo}
              onChangeText={setTitulo}
            />
          </View>

          {/* Categoría */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoryRow}>
              <TouchableOpacity
                style={[
                  styles.catOption,
                  categoria === 'variable' && { backgroundColor: '#FFFBEB', borderColor: '#F59E0B' },
                ]}
                onPress={() => setCategoria('variable')}
              >
                <Ionicons
                  name="cart"
                  size={18}
                  color={categoria === 'variable' ? '#D97706' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.catOptionText,
                    categoria === 'variable' && { color: '#B45309', fontWeight: '700' },
                  ]}
                >
                  Variable
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.catOption,
                  categoria === 'fijo' && { backgroundColor: '#EFF6FF', borderColor: '#2563EB' },
                ]}
                onPress={() => setCategoria('fijo')}
              >
                <Ionicons
                  name="home"
                  size={18}
                  color={categoria === 'fijo' ? '#2563EB' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.catOptionText,
                    categoria === 'fijo' && { color: '#1D4ED8', fontWeight: '700' },
                  ]}
                >
                  Fijo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.catOption,
                  categoria === 'gusto' && { backgroundColor: '#FDF2F8', borderColor: '#DB2777' },
                ]}
                onPress={() => setCategoria('gusto')}
              >
                <Ionicons
                  name="cafe"
                  size={18}
                  color={categoria === 'gusto' ? '#DB2777' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.catOptionText,
                    categoria === 'gusto' && { color: '#BE185D', fontWeight: '700' },
                  ]}
                >
                  Gusto / Ocio
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Tipo de gasto: Personal vs Compartido */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, !esCompartido && styles.typeBtnActive]}
              onPress={() => setEsCompartido(false)}
            >
              <Ionicons
                name="person"
                size={16}
                color={!esCompartido ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.typeBtnText, !esCompartido && styles.typeBtnTextActive]}>
                Solo Mío (Personal)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, esCompartido && styles.typeBtnActive]}
              onPress={() => setEsCompartido(true)}
            >
              <Ionicons
                name="people"
                size={16}
                color={esCompartido ? '#FFFFFF' : '#64748B'}
              />
              <Text style={[styles.typeBtnText, esCompartido && styles.typeBtnTextActive]}>
                Compartido
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sección de detalles si es compartido */}
          {esCompartido && (
            <View style={styles.sharedSection}>
              <Text style={styles.label}>¿Quién pagó el total?</Text>
              <View style={styles.payerRow}>
                <TouchableOpacity
                  style={[styles.payerBtn, yoPague && styles.payerBtnActive]}
                  onPress={() => setYoPague(true)}
                >
                  <Text style={[styles.payerBtnText, yoPague && styles.payerBtnTextActive]}>
                    Yo pagué
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payerBtn, !yoPague && styles.payerBtnActive]}
                  onPress={() => setYoPague(false)}
                >
                  <Text style={[styles.payerBtnText, !yoPague && styles.payerBtnTextActive]}>
                    Pagó otra persona
                  </Text>
                </TouchableOpacity>
              </View>

              {!yoPague && (
                <View style={{ marginTop: 10 }}>
                  <Text style={styles.sublabel}>Nombre de quien pagó:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: Sofía"
                    placeholderTextColor="#94A3B8"
                    value={pagadorNombre}
                    onChangeText={setPagadorNombre}
                  />
                </View>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>
                ¿Con quiénes se divide en partes iguales?
              </Text>
              <Text style={styles.helperText}>
                Se dividirá equitativamente entre ti y los seleccionados:
              </Text>

              <View style={styles.chipsWrap}>
                {participantes.map((part) => {
                  const sel = participantesSeleccionados.includes(part.nombre);
                  return (
                    <TouchableOpacity
                      key={part.id}
                      style={[styles.chip, sel && styles.chipActive]}
                      onPress={() => toggleParticipante(part.nombre)}
                    >
                      <Ionicons
                        name={sel ? 'checkmark-circle' : 'person-outline'}
                        size={14}
                        color={sel ? '#FFFFFF' : '#475569'}
                      />
                      <Text style={[styles.chipText, sel && styles.chipTextActive]}>
                        {part.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Agregar persona rápida */}
              <View style={styles.addContactRow}>
                <TextInput
                  style={styles.addContactInput}
                  placeholder="+ Agregar persona (ej: Lucas)"
                  placeholderTextColor="#94A3B8"
                  value={nuevoContacto}
                  onChangeText={setNuevoContacto}
                />
                <TouchableOpacity style={styles.addContactBtn} onPress={handleCrearContacto}>
                  <Text style={styles.addContactBtnText}>Añadir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Botón Guardar */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.saveBtnText}>
              {isSubmitting ? 'Guardando...' : 'Guardar Gasto'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
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
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  sublabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  input: {
    height: 50,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  catOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  catOptionText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: '#2563EB',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
  },
  sharedSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  payerRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  payerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  payerBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  payerBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  payerBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  addContactRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addContactInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addContactBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addContactBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: '#2563EB',
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
