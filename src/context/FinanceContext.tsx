import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import {
  Gasto,
  Ingreso,
  Liquidacion,
  ParticipanteExterno,
  ResumenFinanciero,
  CategoriaGasto,
  TipoIngreso,
} from '../types/database';
import { calcularResumenFinanciero, DeudaDetalle } from '../services/finance';
import * as SecureStore from 'expo-secure-store';

interface FinanceContextType {
  ingresos: Ingreso[];
  gastos: Gasto[];
  liquidaciones: Liquidacion[];
  participantes: ParticipanteExterno[];
  resumen: ResumenFinanciero;
  deudasPorPersona: DeudaDetalle[];
  isLoading: boolean;
  mesActual: number;
  anioActual: number;
  addIngreso: (monto: number, concepto: string, tipo: TipoIngreso) => Promise<boolean>;
  addGastoPersonal: (
    titulo: string,
    monto: number,
    categoria: CategoriaGasto,
    notas?: string
  ) => Promise<boolean>;
  addGastoCompartidoSimple: (
    titulo: string,
    montoTotal: number,
    categoria: CategoriaGasto,
    pagadoPorMi: boolean,
    pagadoPorNombre: string,
    nombresParticipantes: string[]
  ) => Promise<boolean>;
  addGastoDesglosado: (
    titulo: string,
    categoria: CategoriaGasto,
    pagadoPorMi: boolean,
    pagadoPorNombre: string,
    items: { descripcion: string; precio: number; asignado_a: string[] }[],
    todosLosParticipantes: string[]
  ) => Promise<boolean>;
  addLiquidacion: (
    deNombre: string,
    paraNombre: string,
    monto: number,
    notas?: string
  ) => Promise<boolean>;
  addParticipante: (nombre: string) => Promise<boolean>;
  deleteGasto: (id: string) => Promise<boolean>;
  deleteIngreso: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType>({} as FinanceContextType);

const LOCAL_INGRESOS_KEY = 'admin_gastos_local_ingresos';
const LOCAL_GASTOS_KEY = 'admin_gastos_local_gastos';
const LOCAL_LIQUIDACIONES_KEY = 'admin_gastos_local_liquidaciones';
const LOCAL_PARTICIPANTES_KEY = 'admin_gastos_local_participantes';

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const currentDate = new Date();
  const mesActual = currentDate.getMonth() + 1; // 1-12
  const anioActual = currentDate.getFullYear();

  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
  const [participantes, setParticipantes] = useState<ParticipanteExterno[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cargar datos locales de respaldo
  const loadLocalBackup = async () => {
    try {
      const savedIng = await SecureStore.getItemAsync(LOCAL_INGRESOS_KEY);
      const savedGas = await SecureStore.getItemAsync(LOCAL_GASTOS_KEY);
      const savedLiq = await SecureStore.getItemAsync(LOCAL_LIQUIDACIONES_KEY);
      const savedPart = await SecureStore.getItemAsync(LOCAL_PARTICIPANTES_KEY);

      if (savedIng) setIngresos(JSON.parse(savedIng));
      if (savedGas) setGastos(JSON.parse(savedGas));
      if (savedLiq) setLiquidaciones(JSON.parse(savedLiq));
      if (savedPart) setParticipantes(JSON.parse(savedPart));
    } catch {
      // Ignorar error de lectura local
    }
  };

  const saveDataLocally = async (
    newIng: Ingreso[],
    newGas: Gasto[],
    newLiq: Liquidacion[],
    newPart: ParticipanteExterno[]
  ) => {
    try {
      await SecureStore.setItemAsync(LOCAL_INGRESOS_KEY, JSON.stringify(newIng));
      await SecureStore.setItemAsync(LOCAL_GASTOS_KEY, JSON.stringify(newGas));
      await SecureStore.setItemAsync(LOCAL_LIQUIDACIONES_KEY, JSON.stringify(newLiq));
      await SecureStore.setItemAsync(LOCAL_PARTICIPANTES_KEY, JSON.stringify(newPart));
    } catch {
      // Ignorar error al guardar localmente
    }
  };

  const refreshData = useCallback(async () => {
    if (!user) {
      await loadLocalBackup();
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // 1. Ingresos
      const { data: ingData } = await supabase
        .from('ingresos')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('mes', mesActual)
        .eq('anio', anioActual)
        .order('fecha', { ascending: false });

      // 2. Gastos con divisiones e items
      const { data: gasData } = await supabase
        .from('gastos')
        .select('*, divisiones:gasto_divisiones(*), items:gasto_items(*)')
        .eq('usuario_id', user.id)
        .eq('mes', mesActual)
        .eq('anio', anioActual)
        .order('fecha', { ascending: false });

      // 3. Liquidaciones
      const { data: liqData } = await supabase
        .from('liquidaciones')
        .select('*')
        .eq('usuario_id', user.id)
        .order('fecha', { ascending: false });

      // 4. Participantes
      const { data: partData } = await supabase
        .from('participantes_externos')
        .select('*')
        .eq('creado_por', user.id);

      const finalIng = (ingData as Ingreso[]) || [];
      const finalGas = (gasData as Gasto[]) || [];
      const finalLiq = (liqData as Liquidacion[]) || [];
      const finalPart = (partData as ParticipanteExterno[]) || [];

      setIngresos(finalIng);
      setGastos(finalGas);
      setLiquidaciones(finalLiq);
      setParticipantes(finalPart);

      await saveDataLocally(finalIng, finalGas, finalLiq, finalPart);
    } catch (err) {
      console.warn('Usando datos locales por error de conexión o tablas pendientes:', err);
      await loadLocalBackup();
    } finally {
      setIsLoading(false);
    }
  }, [user, mesActual, anioActual]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Agregar Ingreso
  const addIngreso = async (monto: number, concepto: string, tipo: TipoIngreso): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const newEntry: Ingreso = {
      id: Math.random().toString(36).substring(2, 9),
      usuario_id: user?.id || 'offline_user',
      concepto,
      monto,
      tipo,
      fecha: today,
      mes: mesActual,
      anio: anioActual,
    };

    const updated = [newEntry, ...ingresos];
    setIngresos(updated);
    saveDataLocally(updated, gastos, liquidaciones, participantes);

    if (user) {
      try {
        await supabase.from('ingresos').insert({
          usuario_id: user.id,
          concepto,
          monto,
          tipo,
          fecha: today,
          mes: mesActual,
          anio: anioActual,
        });
      } catch (err) {
        console.error('Error insertando ingreso en Supabase:', err);
      }
    }
    return true;
  };

  // Agregar Gasto Personal
  const addGastoPersonal = async (
    titulo: string,
    monto: number,
    categoria: CategoriaGasto,
    notas?: string
  ): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const newGasto: Gasto = {
      id: Math.random().toString(36).substring(2, 9),
      usuario_id: user?.id || 'offline_user',
      titulo,
      monto_total: monto,
      tipo_gasto: 'personal',
      categoria,
      pagado_por_mi: true,
      pagado_por_nombre: profile?.nombre || 'Yo',
      fecha: today,
      mes: mesActual,
      anio: anioActual,
      notas,
      divisiones: [],
    };

    const updated = [newGasto, ...gastos];
    setGastos(updated);
    saveDataLocally(ingresos, updated, liquidaciones, participantes);

    if (user) {
      try {
        await supabase.from('gastos').insert({
          usuario_id: user.id,
          titulo,
          monto_total: monto,
          tipo_gasto: 'personal',
          categoria,
          pagado_por_mi: true,
          pagado_por_nombre: profile?.nombre || 'Yo',
          fecha: today,
          mes: mesActual,
          anio: anioActual,
          notas,
        });
      } catch (err) {
        console.error('Error insertando gasto en Supabase:', err);
      }
    }
    return true;
  };

  // Agregar Gasto Compartido Simple
  const addGastoCompartidoSimple = async (
    titulo: string,
    montoTotal: number,
    categoria: CategoriaGasto,
    pagadoPorMi: boolean,
    pagadoPorNombre: string,
    nombresParticipantes: string[]
  ): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const todos = Array.from(new Set([profile?.nombre || 'Yo', ...nombresParticipantes]));
    const montoPorPersona = montoTotal / (todos.length || 1);

    const divisiones = todos.map((nom) => ({
      nombre_participante: nom,
      es_usuario_actual: nom.toLowerCase() === 'yo' || nom.toLowerCase() === (profile?.nombre || '').toLowerCase(),
      monto_asignado: Math.round(montoPorPersona * 100) / 100,
    }));

    const newGasto: Gasto = {
      id: Math.random().toString(36).substring(2, 9),
      usuario_id: user?.id || 'offline_user',
      titulo,
      monto_total: montoTotal,
      tipo_gasto: 'compartido_simple',
      categoria,
      pagado_por_mi: pagadoPorMi,
      pagado_por_nombre: pagadoPorNombre,
      fecha: today,
      mes: mesActual,
      anio: anioActual,
      divisiones,
    };

    const updated = [newGasto, ...gastos];
    setGastos(updated);
    saveDataLocally(ingresos, updated, liquidaciones, participantes);

    if (user) {
      try {
        const { data: gastoInsertado } = await supabase
          .from('gastos')
          .insert({
            usuario_id: user.id,
            titulo,
            monto_total: montoTotal,
            tipo_gasto: 'compartido_simple',
            categoria,
            pagado_por_mi: pagadoPorMi,
            pagado_por_nombre: pagadoPorNombre,
            fecha: today,
            mes: mesActual,
            anio: anioActual,
          })
          .select()
          .single();

        if (gastoInsertado) {
          const divToInsert = divisiones.map((d) => ({
            gasto_id: gastoInsertado.id,
            nombre_participante: d.nombre_participante,
            es_usuario_actual: d.es_usuario_actual,
            monto_asignado: d.monto_asignado,
          }));
          await supabase.from('gasto_divisiones').insert(divToInsert);
        }
      } catch (err) {
        console.error('Error insertando gasto compartido:', err);
      }
    }
    return true;
  };

  // Agregar Gasto Desglosado por Ítems
  const addGastoDesglosado = async (
    titulo: string,
    categoria: CategoriaGasto,
    pagadoPorMi: boolean,
    pagadoPorNombre: string,
    items: { descripcion: string; precio: number; asignado_a: string[] }[],
    todosLosParticipantes: string[]
  ): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    let montoTotal = 0;

    // Calcular cuánto le corresponde a cada participante según los ítems que consumió
    const mapaConsumo: Record<string, number> = {};
    for (const p of todosLosParticipantes) {
      mapaConsumo[p] = 0;
    }

    for (const item of items) {
      montoTotal += item.precio;
      const consumidores = item.asignado_a.length > 0 ? item.asignado_a : todosLosParticipantes;
      const costoIndividual = item.precio / consumidores.length;
      for (const c of consumidores) {
        mapaConsumo[c] = (mapaConsumo[c] || 0) + costoIndividual;
      }
    }

    const divisiones = Object.entries(mapaConsumo).map(([nom, montoAsig]) => ({
      nombre_participante: nom,
      es_usuario_actual: nom.toLowerCase() === 'yo' || nom.toLowerCase() === (profile?.nombre || '').toLowerCase(),
      monto_asignado: Math.round(montoAsig * 100) / 100,
    }));

    const newGasto: Gasto = {
      id: Math.random().toString(36).substring(2, 9),
      usuario_id: user?.id || 'offline_user',
      titulo,
      monto_total: montoTotal,
      tipo_gasto: 'compartido_desglosado',
      categoria,
      pagado_por_mi: pagadoPorMi,
      pagado_por_nombre: pagadoPorNombre,
      fecha: today,
      mes: mesActual,
      anio: anioActual,
      divisiones,
      items,
    };

    const updated = [newGasto, ...gastos];
    setGastos(updated);
    saveDataLocally(ingresos, updated, liquidaciones, participantes);

    if (user) {
      try {
        const { data: gastoInsertado } = await supabase
          .from('gastos')
          .insert({
            usuario_id: user.id,
            titulo,
            monto_total: montoTotal,
            tipo_gasto: 'compartido_desglosado',
            categoria,
            pagado_por_mi: pagadoPorMi,
            pagado_por_nombre: pagadoPorNombre,
            fecha: today,
            mes: mesActual,
            anio: anioActual,
          })
          .select()
          .single();

        if (gastoInsertado) {
          const divToInsert = divisiones.map((d) => ({
            gasto_id: gastoInsertado.id,
            nombre_participante: d.nombre_participante,
            es_usuario_actual: d.es_usuario_actual,
            monto_asignado: d.monto_asignado,
          }));
          await supabase.from('gasto_divisiones').insert(divToInsert);

          const itemsToInsert = items.map((it) => ({
            gasto_id: gastoInsertado.id,
            descripcion: it.descripcion,
            precio: it.precio,
            asignado_a: it.asignado_a,
          }));
          await supabase.from('gasto_items').insert(itemsToInsert);
        }
      } catch (err) {
        console.error('Error insertando gasto desglosado:', err);
      }
    }
    return true;
  };

  // Agregar Liquidación (Saldar deuda)
  const addLiquidacion = async (
    deNombre: string,
    paraNombre: string,
    monto: number,
    notas?: string
  ): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const newLiq: Liquidacion = {
      id: Math.random().toString(36).substring(2, 9),
      usuario_id: user?.id || 'offline_user',
      de_nombre: deNombre,
      para_nombre: paraNombre,
      monto,
      fecha: today,
      notas,
    };

    const updated = [newLiq, ...liquidaciones];
    setLiquidaciones(updated);
    saveDataLocally(ingresos, gastos, updated, participantes);

    if (user) {
      try {
        await supabase.from('liquidaciones').insert({
          usuario_id: user.id,
          de_nombre: deNombre,
          para_nombre: paraNombre,
          monto,
          fecha: today,
          notas,
        });
      } catch (err) {
        console.error('Error guardando liquidación:', err);
      }
    }
    return true;
  };

  // Agregar Participante / Contacto
  const addParticipante = async (nombre: string): Promise<boolean> => {
    const clean = nombre.trim();
    if (!clean) return false;

    if (participantes.some((p) => p.nombre.toLowerCase() === clean.toLowerCase())) {
      return true; // Ya existe
    }

    const newPart: ParticipanteExterno = {
      id: Math.random().toString(36).substring(2, 9),
      creado_por: user?.id || 'offline_user',
      nombre: clean,
    };

    const updated = [...participantes, newPart];
    setParticipantes(updated);
    saveDataLocally(ingresos, gastos, liquidaciones, updated);

    if (user) {
      try {
        await supabase.from('participantes_externos').insert({
          creado_por: user.id,
          nombre: clean,
        });
      } catch (err) {
        console.error('Error guardando participante en Supabase:', err);
      }
    }
    return true;
  };

  const deleteGasto = async (id: string): Promise<boolean> => {
    const updated = gastos.filter((g) => g.id !== id);
    setGastos(updated);
    saveDataLocally(ingresos, updated, liquidaciones, participantes);

    if (user) {
      try {
        await supabase.from('gastos').delete().eq('id', id);
      } catch (err) {
        console.error('Error eliminando gasto:', err);
      }
    }
    return true;
  };

  const deleteIngreso = async (id: string): Promise<boolean> => {
    const updated = ingresos.filter((i) => i.id !== id);
    setIngresos(updated);
    saveDataLocally(updated, gastos, liquidaciones, participantes);

    if (user) {
      try {
        await supabase.from('ingresos').delete().eq('id', id);
      } catch (err) {
        console.error('Error eliminando ingreso:', err);
      }
    }
    return true;
  };

  const { resumen, deudasPorPersona } = calcularResumenFinanciero(
    ingresos,
    gastos,
    liquidaciones,
    profile?.nombre || 'Yo'
  );

  return (
    <FinanceContext.Provider
      value={{
        ingresos,
        gastos,
        liquidaciones,
        participantes,
        resumen,
        deudasPorPersona,
        isLoading,
        mesActual,
        anioActual,
        addIngreso,
        addGastoPersonal,
        addGastoCompartidoSimple,
        addGastoDesglosado,
        addLiquidacion,
        addParticipante,
        deleteGasto,
        deleteIngreso,
        refreshData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => useContext(FinanceContext);
