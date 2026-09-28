export type TipoGasto = 'personal' | 'compartido_simple' | 'compartido_desglosado';
export type CategoriaGasto = 'fijo' | 'variable' | 'gusto' | 'otro';
export type TipoIngreso = 'sueldo' | 'extra';

export interface Profile {
  id: string;
  nombre: string;
  email: string | null;
  pin_hash: string | null;
  moneda: string;
  biometria_activa: boolean;
  created_at?: string;
}

export interface Ingreso {
  id: string;
  usuario_id: string;
  concepto: string;
  monto: number;
  tipo: TipoIngreso;
  fecha: string;
  mes: number;
  anio: number;
  created_at?: string;
}

export interface ParticipanteExterno {
  id: string;
  creado_por: string;
  nombre: string;
  created_at?: string;
}

export interface GastoDivision {
  id?: string;
  gasto_id?: string;
  nombre_participante: string;
  es_usuario_actual: boolean;
  monto_asignado: number;
}

export interface GastoItem {
  id?: string;
  gasto_id?: string;
  descripcion: string;
  precio: number;
  asignado_a: string[]; // Nombres de los participantes que consumieron este ítem
}

export interface Gasto {
  id: string;
  usuario_id: string;
  titulo: string;
  monto_total: number;
  tipo_gasto: TipoGasto;
  categoria: CategoriaGasto;
  pagado_por_mi: boolean;
  pagado_por_nombre: string;
  fecha: string;
  mes: number;
  anio: number;
  notas?: string;
  created_at?: string;
  divisiones?: GastoDivision[];
  items?: GastoItem[];
}

export interface Liquidacion {
  id: string;
  usuario_id: string;
  de_nombre: string;
  para_nombre: string;
  monto: number;
  fecha: string;
  notas?: string;
  created_at?: string;
}

export interface ResumenFinanciero {
  sueldoTotal: number;
  ingresosExtras: number;
  totalIngresos: number;
  gastosFijos: number;
  gastosVariables: number;
  gastosGustos: number;
  totalGastosPersonales: number;
  saldoRestante: number;
  porcentajeGastado: number;
  teDeben: number;
  debes: number;
}
