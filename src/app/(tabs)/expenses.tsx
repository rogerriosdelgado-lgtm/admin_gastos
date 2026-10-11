import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFinance } from '../../context/FinanceContext';
import { formatearMoneda } from '../../services/finance';
import { Gasto, CategoriaGasto } from '../../types/database';
import { Ionicons } from '@expo/vector-icons';
import { MonthSelector } from '../../components/MonthSelector';

type FilterType = 'todos' | CategoriaGasto | 'compartido';

export default function ExpensesScreen() {
  const { gastos, deleteGasto, isLoading, refreshData } = useFinance();
  const [filtro, setFiltro] = useState<FilterType>('todos');
  const [busqueda, setBusqueda] = useState('');

  const gastosFiltrados = gastos.filter((g) => {
    // Filtro por categoría o tipo
    if (filtro === 'compartido') {
      if (g.tipo_gasto === 'personal') return false;
    } else if (filtro !== 'todos') {
      if (g.categoria !== filtro) return false;
    }

    // Filtro por búsqueda
    if (busqueda.trim()) {
      return g.titulo.toLowerCase().includes(busqueda.toLowerCase());
    }

    return true;
  });

  const handleDelete = (id: string, titulo: string) => {
    Alert.alert(
      'Eliminar Gasto',
      `¿Estás seguro de que deseas eliminar "${titulo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteGasto(id) },
      ]
    );
  };

  const renderItem = ({ item }: { item: Gasto }) => {
    const esCompartido = item.tipo_gasto !== 'personal';

    return (
      <View style={styles.card}>
        <View
          style={[
            styles.iconBox,
            item.categoria === 'fijo'
              ? { backgroundColor: '#EFF6FF' }
              : item.categoria === 'gusto'
              ? { backgroundColor: '#FDF2F8' }
              : { backgroundColor: '#FFFBEB' },
          ]}
        >
          <Ionicons
            name={
              item.categoria === 'fijo'
                ? 'home'
                : item.categoria === 'gusto'
                ? 'cafe'
                : 'cart'
            }
            size={20}
            color={
              item.categoria === 'fijo'
                ? '#2563EB'
                : item.categoria === 'gusto'
                ? '#DB2777'
                : '#D97706'
            }
          />
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.title}>{item.titulo}</Text>
          <View style={styles.tagsRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {item.categoria.charAt(0).toUpperCase() + item.categoria.slice(1)}
              </Text>
            </View>
            {esCompartido && (
              <View style={styles.sharedBadge}>
                <Ionicons name="people" size={10} color="#7C3AED" />
                <Text style={styles.sharedBadgeText}>
                  {item.tipo_gasto === 'compartido_desglosado' ? 'Ticket desglosado' : 'Compartido'}
                </Text>
              </View>
            )}
            <Text style={styles.dateText}>{item.fecha}</Text>
          </View>
        </View>

        <View style={styles.priceColumn}>
          <Text style={styles.amount}>-{formatearMoneda(item.monto_total)}</Text>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.titulo)}
            style={styles.deleteBtn}
          >
            <Ionicons name="trash-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Movimientos y Gastos</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/modal/new-expense')}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Selector de Mes e Historial */}
        <MonthSelector containerStyle={styles.monthSelectorWrapper} />

        {/* Buscador */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por concepto..."
            placeholderTextColor="#94A3B8"
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros */}
        <View style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filtro === 'todos' && styles.filterChipActive]}
            onPress={() => setFiltro('todos')}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === 'todos' && styles.filterChipTextActive,
              ]}
            >
              Todos ({gastos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'fijo' && styles.filterChipActive]}
            onPress={() => setFiltro('fijo')}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === 'fijo' && styles.filterChipTextActive,
              ]}
            >
              Fijos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'variable' && styles.filterChipActive]}
            onPress={() => setFiltro('variable')}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === 'variable' && styles.filterChipTextActive,
              ]}
            >
              Variables
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'gusto' && styles.filterChipActive]}
            onPress={() => setFiltro('gusto')}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === 'gusto' && styles.filterChipTextActive,
              ]}
            >
              Gustos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtro === 'compartido' && styles.filterChipActive]}
            onPress={() => setFiltro('compartido')}
          >
            <Text
              style={[
                styles.filterChipText,
                filtro === 'compartido' && styles.filterChipTextActive,
              ]}
            >
              Compartidos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista */}
        <FlatList
          data={gastosFiltrados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refreshData}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No hay gastos para mostrar</Text>
              <Text style={styles.emptyDesc}>
                {busqueda ? 'No encontramos coincidencias' : 'Comienza agregando tu primer gasto'}
              </Text>
            </View>
          }
        />
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
    padding: 20,
    paddingBottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBox: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  categoryBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sharedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  priceColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 42,
  },
  amount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  deleteBtn: {
    padding: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  monthSelectorWrapper: {
    marginBottom: 12,
  },
});
