import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { formatearMoneda } from '../../services/finance';
import { Ionicons } from '@expo/vector-icons';

export default function SplitScreen() {
  const { deudasPorPersona, gastos, resumen } = useFinance();

  const gastosCompartidos = gastos.filter((g) => g.tipo_gasto !== 'personal');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cuentas Claras</Text>
          <Text style={styles.headerSub}>Control de deudas y gastos compartidos</Text>
        </View>

        {/* Balance General Banner */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>TE DEBEN EN TOTAL</Text>
            <Text style={[styles.summaryAmount, { color: '#059669' }]}>
              {formatearMoneda(resumen.teDeben)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryColumn}>
            <Text style={styles.summaryLabel}>DEBES EN TOTAL</Text>
            <Text style={[styles.summaryAmount, { color: '#DC2626' }]}>
              {formatearMoneda(resumen.debes)}
            </Text>
          </View>
        </View>

        {/* Acciones principales */}
        <View style={styles.btnRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#7C3AED' }]}
            onPress={() => router.push('/modal/itemized-split')}
          >
            <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Dividir Ticket por Ítems</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#2563EB' }]}
            onPress={() => router.push('/modal/settle-debt')}
          >
            <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.btnText}>Saldar Deuda</Text>
          </TouchableOpacity>
        </View>

        {/* Saldos por Persona */}
        <Text style={styles.sectionTitle}>Saldos por Persona</Text>
        {deudasPorPersona.length === 0 ? (
          <View style={styles.settledCard}>
            <Ionicons name="checkmark-done-circle" size={42} color="#10B981" />
            <Text style={styles.settledTitle}>¡Están al día!</Text>
            <Text style={styles.settledDesc}>
              No hay deudas pendientes entre tú y las demás personas.
            </Text>
          </View>
        ) : (
          deudasPorPersona.map((deuda, idx) => {
            const teDebe = deuda.monto > 0;
            return (
              <View key={idx} style={styles.debtCard}>
                <View
                  style={[
                    styles.avatarMini,
                    { backgroundColor: teDebe ? '#ECFDF5' : '#FEF2F2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.avatarText,
                      { color: teDebe ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {deuda.nombre.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.debtName}>{deuda.nombre}</Text>
                  <Text
                    style={[
                      styles.debtStatus,
                      { color: teDebe ? '#059669' : '#DC2626' },
                    ]}
                  >
                    {teDebe
                      ? `Te debe ${formatearMoneda(deuda.monto)}`
                      : `Le debes ${formatearMoneda(Math.abs(deuda.monto))}`}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.settleBtn,
                    { backgroundColor: teDebe ? '#ECFDF5' : '#EFF6FF' },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/modal/settle-debt',
                      params: {
                        persona: deuda.nombre,
                        monto: Math.abs(deuda.monto).toString(),
                        tePagaATi: teDebe ? 'true' : 'false',
                      },
                    })
                  }
                >
                  <Text
                    style={[
                      styles.settleBtnText,
                      { color: teDebe ? '#059669' : '#2563EB' },
                    ]}
                  >
                    Liquidar
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}

        {/* Historial de Gastos Compartidos */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
          Historial Compartido del Mes
        </Text>
        {gastosCompartidos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay compras compartidas registradas</Text>
          </View>
        ) : (
          gastosCompartidos.map((gasto) => (
            <View key={gasto.id} style={styles.sharedExpenseCard}>
              <View style={styles.sharedHeader}>
                <View>
                  <Text style={styles.sharedTitle}>{gasto.titulo}</Text>
                  <Text style={styles.sharedPayer}>
                    Pagado por: {gasto.pagado_por_mi ? 'Ti' : gasto.pagado_por_nombre}
                  </Text>
                </View>
                <Text style={styles.sharedTotal}>{formatearMoneda(gasto.monto_total)}</Text>
              </View>

              {/* Detalle de divisiones */}
              {gasto.divisiones && gasto.divisiones.length > 0 && (
                <View style={styles.divisionsList}>
                  {gasto.divisiones.map((div, dIdx) => (
                    <View key={dIdx} style={styles.divisionItem}>
                      <Text style={styles.divisionName}>
                        {div.nombre_participante} {div.es_usuario_actual && '(Tú)'}
                      </Text>
                      <Text style={styles.divisionAmount}>
                        {formatearMoneda(div.monto_asignado)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
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
  headerSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  settledCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settledTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  settledDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  debtCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
  },
  debtName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  debtStatus: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  settleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  settleBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  sharedExpenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sharedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sharedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sharedPayer: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sharedTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  divisionsList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  divisionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divisionName: {
    fontSize: 12,
    color: '#475569',
  },
  divisionAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
});
