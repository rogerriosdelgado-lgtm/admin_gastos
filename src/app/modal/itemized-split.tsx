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
import { formatearMoneda } from '../../services/finance';
import { Ionicons } from '@expo/vector-icons';

interface ItemLocal {
  id: string;
  descripcion: string;
  precioStr: string;
  asignados: string[]; // Nombres de quienes consumieron este ítem
}

export default function ItemizedSplitModal() {
  const { profile } = useAuth();
  const { addGastoDesglosado, participantes, addParticipante } = useFinance();

  const miNombre = profile?.nombre || 'Yo';
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('gusto');
  const [yoPague, setYoPague] = useState(true);
  const [pagadorNombre, setPagadorNombre] = useState(miNombre);

  // Lista de personas en este evento/ticket
  const [participantesGrupo, setParticipantesGrupo] = useState<string[]>([miNombre]);
  const [nuevoParticipanteNombre, setNuevoParticipanteNombre] = useState('');

  // Lista de ítems del ticket
  const [items, setItems] = useState<ItemLocal[]>([
    {
      id: '1',
      descripcion: '',
      precioStr: '',
      asignados: [miNombre],
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agregar persona al grupo del ticket
  const handleAddPersona = async () => {
    const nom = nuevoParticipanteNombre.trim();
    if (!nom) return;
    if (participantesGrupo.some((p) => p.toLowerCase() === nom.toLowerCase())) {
      Alert.alert('Aviso', 'Esta persona ya está en la lista');
      return;
    }

    await addParticipante(nom);
    setParticipantesGrupo([...participantesGrupo, nom]);
    setNuevoParticipanteNombre('');
  };

  // Agregar ítem nuevo
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        descripcion: '',
        precioStr: '',
        asignados: [...participantesGrupo], // Por defecto todos o al menos Yo
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      Alert.alert('Aviso', 'Debe haber al menos un producto en el ticket');
      return;
    }
    setItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: 'descripcion' | 'precioStr', value: string) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleToggleConsumidor = (itemId: string, persona: string) => {
    setItems(
      items.map((it) => {
        if (it.id !== itemId) return it;
        const exists = it.asignados.includes(persona);
        const newAsignados = exists
          ? it.asignados.filter((p) => p !== persona)
          : [...it.asignados, persona];
        return { ...it, asignados: newAsignados };
      })
    );
  };

  // Cálculo en vivo
  let totalTicket = 0;
  const desglosePorPersona: Record<string, number> = {};
  for (const p of participantesGrupo) {
    desglosePorPersona[p] = 0;
  }

  for (const it of items) {
    const precio = parseFloat(it.precioStr.replace(',', '.')) || 0;
    totalTicket += precio;
    const consumidores = it.asignados.length > 0 ? it.asignados : [miNombre];
    const porcion = precio / consumidores.length;
    for (const c of consumidores) {
      desglosePorPersona[c] = (desglosePorPersona[c] || 0) + porcion;
    }
  }

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      Alert.alert('Falta título', 'Escribe el nombre de la salida o compra (ej. Cena, Supermercado)');
      return;
    }

    if (totalTicket <= 0) {
      Alert.alert('Ticket vacío', 'Agrega montos a los productos del ticket');
      return;
    }

    const itemsFinales = items.map((it) => ({
      descripcion: it.descripcion.trim() || 'Ítem sin nombre',
      precio: parseFloat(it.precioStr.replace(',', '.')) || 0,
      asignado_a: it.asignados.length > 0 ? it.asignados : [miNombre],
    }));

    setIsSubmitting(true);
    try {
      await addGastoDesglosado(
        titulo.trim(),
        categoria,
        yoPague,
        yoPague ? miNombre : pagadorNombre,
        itemsFinales,
        participantesGrupo
      );
      router.back();
    } catch {
      Alert.alert('Error', 'No se pudo guardar la división del ticket');
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
          <View>
            <Text style={styles.headerTitle}>Dividir Ticket por Ítems</Text>
            <Text style={styles.headerSub}>Asigna cada producto a quien lo consumió</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Título y Categoría */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>1. Datos Generales</Text>
            <TextInput
              style={styles.input}
              placeholder="Título: ej. Salida a Cenar, Asado, Supermercado"
              placeholderTextColor="#94A3B8"
              value={titulo}
              onChangeText={setTitulo}
            />

            <View style={styles.catRow}>
              <TouchableOpacity
                style={[styles.catPill, categoria === 'gusto' && styles.catPillActive]}
                onPress={() => setCategoria('gusto')}
              >
                <Text style={[styles.catPillText, categoria === 'gusto' && styles.catPillTextActive]}>
                  Salida / Gusto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catPill, categoria === 'variable' && styles.catPillActive]}
                onPress={() => setCategoria('variable')}
              >
                <Text style={[styles.catPillText, categoria === 'variable' && styles.catPillTextActive]}>
                  Variable (Super)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.catPill, categoria === 'fijo' && styles.catPillActive]}
                onPress={() => setCategoria('fijo')}
              >
                <Text style={[styles.catPillText, categoria === 'fijo' && styles.catPillTextActive]}>
                  Fijo
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quién pagó */}
            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>¿Quién pagó la cuenta?</Text>
            <View style={styles.payerRow}>
              <TouchableOpacity
                style={[styles.payerBtn, yoPague && styles.payerBtnActive]}
                onPress={() => setYoPague(true)}
              >
                <Text style={[styles.payerBtnText, yoPague && styles.payerBtnTextActive]}>
                  Yo pagué todo
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
              <TextInput
                style={[styles.input, { marginTop: 10 }]}
                placeholder="Nombre de quien pagó"
                placeholderTextColor="#94A3B8"
                value={pagadorNombre}
                onChangeText={setPagadorNombre}
              />
            )}
          </View>

          {/* Personas en este ticket */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>2. ¿Quiénes participaron en la compra?</Text>
            <Text style={styles.helperText}>
              Agrega los nombres de las personas (aunque no tengan la app):
            </Text>

            <View style={styles.personasWrap}>
              {participantesGrupo.map((p, idx) => (
                <View key={idx} style={styles.personaChip}>
                  <Ionicons name="person" size={14} color="#7C3AED" />
                  <Text style={styles.personaChipText}>{p}</Text>
                  {p !== miNombre && (
                    <TouchableOpacity
                      onPress={() => setParticipantesGrupo(participantesGrupo.filter((x) => x !== p))}
                    >
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            <View style={styles.addPersonaRow}>
              <TextInput
                style={styles.addPersonaInput}
                placeholder="Nombre (ej: Pedro, Lucía...)"
                placeholderTextColor="#94A3B8"
                value={nuevoParticipanteNombre}
                onChangeText={setNuevoParticipanteNombre}
              />
              <TouchableOpacity style={styles.addPersonaBtn} onPress={handleAddPersona}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addPersonaBtnText}>Añadir</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Desglose de Productos */}
          <View style={styles.card}>
            <View style={styles.cardRowHeader}>
              <Text style={styles.sectionLabel}>3. Detalle de Ítems / Productos</Text>
              <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
                <Ionicons name="add-circle" size={18} color="#2563EB" />
                <Text style={styles.addItemBtnText}>+ Ítem</Text>
              </TouchableOpacity>
            </View>

            {items.map((item, index) => (
              <View key={item.id} style={styles.itemBox}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemNumber}>Producto #{index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.itemInputsRow}>
                  <TextInput
                    style={[styles.input, { flex: 2 }]}
                    placeholder="Descripción (ej: Pizza)"
                    placeholderTextColor="#94A3B8"
                    value={item.descripcion}
                    onChangeText={(val) => handleUpdateItem(item.id, 'descripcion', val)}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1, textAlign: 'right', fontWeight: '700' }]}
                    placeholder="$ 0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={item.precioStr}
                    onChangeText={(val) => handleUpdateItem(item.id, 'precioStr', val)}
                  />
                </View>

                {/* Quiénes consumieron este ítem */}
                <Text style={styles.consumersLabel}>¿Quiénes lo consumieron?</Text>
                <View style={styles.consumersRow}>
                  {participantesGrupo.map((p, pIdx) => {
                    const consumes = item.asignados.includes(p);
                    return (
                      <TouchableOpacity
                        key={pIdx}
                        style={[styles.consumerPill, consumes && styles.consumerPillActive]}
                        onPress={() => handleToggleConsumidor(item.id, p)}
                      >
                        <Text
                          style={[
                            styles.consumerPillText,
                            consumes && styles.consumerPillTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>

          {/* Resumen Final de División */}
          <View style={styles.totalCard}>
            <View style={styles.totalHeaderRow}>
              <Text style={styles.totalLabel}>TOTAL FACTURA</Text>
              <Text style={styles.totalAmount}>{formatearMoneda(totalTicket)}</Text>
            </View>

            <View style={styles.totalDivider} />

            <Text style={styles.breakdownTitle}>A cada uno le corresponde pagar:</Text>
            {Object.entries(desglosePorPersona).map(([nom, monto], bIdx) => (
              <View key={bIdx} style={styles.breakdownRow}>
                <Text style={styles.breakdownName}>{nom}</Text>
                <Text style={styles.breakdownAmount}>{formatearMoneda(monto)}</Text>
              </View>
            ))}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.saveBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.saveBtnText}>
              {isSubmitting ? 'Calculando y guardando...' : 'Guardar y Aplicar División'}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 10,
  },
  input: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  catRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  catPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  catPillActive: {
    backgroundColor: '#7C3AED',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  payerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  payerBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
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
    color: '#64748B',
  },
  payerBtnTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  personasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  personaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  personaChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6D28D9',
  },
  addPersonaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addPersonaInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  addPersonaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addPersonaBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cardRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  itemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  itemInputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  consumersLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6,
  },
  consumersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  consumerPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  consumerPillActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  consumerPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  consumerPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  totalCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  totalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownName: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  breakdownAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
  },
  saveBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
