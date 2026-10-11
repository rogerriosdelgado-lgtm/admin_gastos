import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../context/FinanceContext';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

interface Props {
  containerStyle?: object;
}

export const MonthSelector: React.FC<Props> = ({ containerStyle }) => {
  const {
    mesSeleccionado,
    anioSeleccionado,
    mesActual,
    anioActual,
    cambiarMes,
    irAlMesActual,
  } = useFinance();

  const esMesActual = mesSeleccionado === mesActual && anioSeleccionado === anioActual;
  const nombreMes = MESES[mesSeleccionado - 1] || '';

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => cambiarMes(-1)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.contentColumn}>
          <Text style={styles.monthTitle}>
            {nombreMes} {anioSeleccionado}
          </Text>

          {esMesActual ? (
            <View style={styles.currentBadge}>
              <View style={styles.currentDot} />
              <Text style={styles.currentBadgeText}>Mes en curso</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.returnButton}
              onPress={irAlMesActual}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={12} color="#2563EB" />
              <Text style={styles.returnButtonText}>Volver al mes actual</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => cambiarMes(1)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  arrowButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 5,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  returnButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
});
