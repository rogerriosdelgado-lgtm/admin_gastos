import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatearMoneda } from '../../services/finance';
import { Ionicons } from '@expo/vector-icons';
import { MonthSelector } from '../../components/MonthSelector';

export default function DashboardScreen() {
  const { profile } = useAuth();
  const { resumen, gastos, isLoading, refreshData } = useFinance();

  const ultimosGastos = gastos.slice(0, 5);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {profile?.nombre || 'Usuario'} 👋</Text>
            <Text style={styles.subGreeting}>Control de gastos e ingresos</Text>
          </View>
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="shield-checkmark-outline" size={22} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {/* Navegador de Mes e Historial */}
        <MonthSelector containerStyle={styles.monthSelectorWrapper} />

        {/* Tarjeta Principal de Saldo y Sueldo */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>SALDO DISPONIBLE</Text>
            <TouchableOpacity onPress={() => router.push('/modal/new-income')}>
              <Text style={styles.addIncomeText}>+ Agregar Ingreso</Text>
            </TouchableOpacity>
          </View>

          <Text
            style={[
              styles.balanceAmount,
              resumen.saldoRestante < 0 && styles.negativeBalance,
            ]}
          >
            {formatearMoneda(resumen.saldoRestante)}
          </Text>

          {/* Barra de progreso de gastos del mes */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(resumen.porcentajeGastado, 100)}%` },
                  resumen.porcentajeGastado > 85 ? styles.progressDanger : styles.progressNormal,
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              Has consumido el {resumen.porcentajeGastado}% de tus ingresos
            </Text>
          </View>

          {/* Submétricas */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: '#10B981' }]} />
              <View>
                <Text style={styles.metricLabel}>Ingresos / Sueldo</Text>
                <Text style={styles.metricValue}>{formatearMoneda(resumen.totalIngresos)}</Text>
              </View>
            </View>

            <View style={styles.dividerVertical} />

            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: '#EF4444' }]} />
              <View>
                <Text style={styles.metricLabel}>Gastos Totales</Text>
                <Text style={styles.metricValue}>
                  {formatearMoneda(resumen.totalGastosPersonales)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#2563EB' }]}
            onPress={() => router.push('/modal/new-expense')}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Nuevo Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#7C3AED' }]}
            onPress={() => router.push('/modal/itemized-split')}
          >
            <Ionicons name="receipt" size={24} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Dividir Ticket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#059669' }]}
            onPress={() => router.push('/modal/new-income')}
          >
            <Ionicons name="trending-up" size={24} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>+ Sueldo</Text>
          </TouchableOpacity>
        </View>

        {/* Resumen por Categorías */}
        <Text style={styles.sectionTitle}>Distribución de tus Gastos</Text>
        <View style={styles.categoriesRow}>
          {/* Fijos */}
          <View style={[styles.categoryCard, { borderColor: '#DBEAFE' }]}>
            <View style={[styles.catIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="home-outline" size={20} color="#2563EB" />
            </View>
            <Text style={styles.catName}>Fijos</Text>
            <Text style={styles.catAmount}>{formatearMoneda(resumen.gastosFijos)}</Text>
          </View>

          {/* Variables */}
          <View style={[styles.categoryCard, { borderColor: '#FEF3C7' }]}>
            <View style={[styles.catIconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="cart-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.catName}>Variables</Text>
            <Text style={styles.catAmount}>{formatearMoneda(resumen.gastosVariables)}</Text>
          </View>

          {/* Gustos */}
          <View style={[styles.categoryCard, { borderColor: '#FCE7F3' }]}>
            <View style={[styles.catIconCircle, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="cafe-outline" size={20} color="#DB2777" />
            </View>
            <Text style={styles.catName}>Gustos</Text>
            <Text style={styles.catAmount}>{formatearMoneda(resumen.gastosGustos)}</Text>
          </View>
        </View>

        {/* Resumen Splitwise / Cuentas Compartidas */}
        <TouchableOpacity
          style={styles.splitBanner}
          onPress={() => router.push('/(tabs)/split')}
        >
          <View style={styles.splitIconBox}>
            <Ionicons name="people" size={24} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.splitBannerTitle}>Cuentas Compartidas</Text>
            <Text style={styles.splitBannerSubtitle}>
              {resumen.teDeben > 0
                ? `Te deben ${formatearMoneda(resumen.teDeben)} en total`
                : resumen.debes > 0
                ? `Debes ${formatearMoneda(resumen.debes)} en total`
                : 'Están al día, nadie debe nada'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Últimos Movimientos */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos Movimientos</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/expenses')}>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {ultimosGastos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={36} color="#CBD5E1" />
            <Text style={styles.emptyText}>Aún no hay gastos registrados este mes</Text>
          </View>
        ) : (
          ultimosGastos.map((gasto) => (
            <View key={gasto.id} style={styles.expenseItem}>
              <View
                style={[
                  styles.expenseIconBox,
                  gasto.categoria === 'fijo'
                    ? { backgroundColor: '#EFF6FF' }
                    : gasto.categoria === 'gusto'
                    ? { backgroundColor: '#FDF2F8' }
                    : { backgroundColor: '#FFFBEB' },
                ]}
              >
                <Ionicons
                  name={
                    gasto.categoria === 'fijo'
                      ? 'home'
                      : gasto.categoria === 'gusto'
                      ? 'cafe'
                      : 'cart'
                  }
                  size={18}
                  color={
                    gasto.categoria === 'fijo'
                      ? '#2563EB'
                      : gasto.categoria === 'gusto'
                      ? '#DB2777'
                      : '#D97706'
                  }
                />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.expenseTitle}>{gasto.titulo}</Text>
                <Text style={styles.expenseSub}>
                  {gasto.tipo_gasto === 'personal'
                    ? `Personal • ${gasto.fecha}`
                    : `Compartido • ${gasto.fecha}`}
                </Text>
              </View>

              <Text style={styles.expenseAmount}>
                -{formatearMoneda(gasto.monto_total)}
              </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  monthSelectorWrapper: {
    marginBottom: 16,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  addIncomeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 10,
    letterSpacing: -0.5,
  },
  negativeBalance: {
    color: '#DC2626',
  },
  progressContainer: {
    marginVertical: 8,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressNormal: {
    backgroundColor: '#2563EB',
  },
  progressDanger: {
    backgroundColor: '#EF4444',
  },
  progressText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  dividerVertical: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  categoryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  catIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  catAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  splitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    marginBottom: 24,
  },
  splitIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  splitBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#4C1D95',
  },
  splitBannerSubtitle: {
    fontSize: 13,
    color: '#6D28D9',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  expenseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  expenseSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
});
