import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function IndexGateway() {
  const { user, isUnlocked, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/(auth)/login');
    } else if (!isUnlocked) {
      router.replace('/(auth)/unlock');
    } else {
      router.replace('/(tabs)');
    }
  }, [user, isUnlocked, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="wallet-outline" size={48} color="#2563EB" />
      </View>
      <Text style={styles.title}>Gastos & Cuentas</Text>
      <Text style={styles.subtitle}>Tu administrador financiero personal</Text>
      <ActivityIndicator size="large" color="#2563EB" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  spinner: {
    marginTop: 36,
  },
});
