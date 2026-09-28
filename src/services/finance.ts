import { Gasto, Ingreso, Liquidacion, ResumenFinanciero } from '../types/database';

export interface DeudaDetalle {
  nombre: string;
  monto: number; // Positivo: te debe dinero. Negativo: le debes dinero.
}

export const calcularResumenFinanciero = (
  ingresos: Ingreso[],
  gastos: Gasto[],
  liquidaciones: Liquidacion[],
  nombreUsuarioActual: string = 'Yo'
): { resumen: ResumenFinanciero; deudasPorPersona: DeudaDetalle[] } => {
  let sueldoTotal = 0;
  let ingresosExtras = 0;

  for (const ing of ingresos) {
    if (ing.tipo === 'sueldo') {
      sueldoTotal += Number(ing.monto) || 0;
    } else {
      ingresosExtras += Number(ing.monto) || 0;
    }
  }

  const totalIngresos = sueldoTotal + ingresosExtras;

  let gastosFijos = 0;
  let gastosVariables = 0;
  let gastosGustos = 0;

  // Mapa de deudas por participante: nombre -> saldo neto (positivo = me debe, negativo = le debo)
  const balances: Record<string, number> = {};

  const registrarBalance = (persona: string, monto: number) => {
    const key = persona.trim();
    if (!key || key.toLowerCase() === nombreUsuarioActual.toLowerCase() || key.toLowerCase() === 'yo') {
      return;
    }
    balances[key] = (balances[key] || 0) + monto;
  };

  for (const gasto of gastos) {
    const monto = Number(gasto.monto_total) || 0;

    if (gasto.tipo_gasto === 'personal') {
      if (gasto.categoria === 'fijo') gastosFijos += monto;
      else if (gasto.categoria === 'gusto') gastosGustos += monto;
      else gastosVariables += monto;
    } else {
      // Gasto compartido (simple o desglosado)
      const divisiones = gasto.divisiones || [];
      const yoPague = gasto.pagado_por_mi;

      // Calcular parte correspondiente a cada uno
      for (const div of divisiones) {
        const parte = Number(div.monto_asignado) || 0;
        const esYo = div.es_usuario_actual || div.nombre_participante.toLowerCase() === 'yo' || div.nombre_participante.toLowerCase() === nombreUsuarioActual.toLowerCase();

        if (esYo) {
          // La parte del usuario se categoriza como gasto personal
          if (gasto.categoria === 'fijo') gastosFijos += parte;
          else if (gasto.categoria === 'gusto') gastosGustos += parte;
          else gastosVariables += parte;

          if (!yoPague) {
            // Alguien más pagó por mí -> le debo su parte
            registrarBalance(gasto.pagado_por_nombre, -parte);
          }
        } else {
          // Participante externo u otra persona
          if (yoPague) {
            // Yo pagué por él -> me debe esa parte
            registrarBalance(div.nombre_participante, parte);
          }
        }
      }
    }
  }

  // Aplicar liquidaciones (pagos para saldar deudas)
  for (const liq of liquidaciones) {
    const monto = Number(liq.monto) || 0;
    const de = liq.de_nombre.trim();
    const para = liq.para_nombre.trim();

    const deEsYo = de.toLowerCase() === 'yo' || de.toLowerCase() === nombreUsuarioActual.toLowerCase();
    const paraEsYo = para.toLowerCase() === 'yo' || para.toLowerCase() === nombreUsuarioActual.toLowerCase();

    if (deEsYo) {
      // Yo le pagué a otra persona: reduce lo que le debía a esa persona
      registrarBalance(para, monto);
    } else if (paraEsYo) {
      // Otra persona me pagó a mí: reduce lo que me debía
      registrarBalance(de, -monto);
    }
  }

  let teDeben = 0;
  let debes = 0;
  const deudasPorPersona: DeudaDetalle[] = [];

  for (const [nombre, saldo] of Object.entries(balances)) {
    if (Math.abs(saldo) > 0.01) {
      deudasPorPersona.push({ nombre, monto: saldo });
      if (saldo > 0) {
        teDeben += saldo;
      } else {
        debes += Math.abs(saldo);
      }
    }
  }

  const totalGastosPersonales = gastosFijos + gastosVariables + gastosGustos;
  const saldoRestante = totalIngresos - totalGastosPersonales;
  const porcentajeGastado = totalIngresos > 0 ? (totalGastosPersonales / totalIngresos) * 100 : 0;

  const resumen: ResumenFinanciero = {
    sueldoTotal,
    ingresosExtras,
    totalIngresos,
    gastosFijos,
    gastosVariables,
    gastosGustos,
    totalGastosPersonales,
    saldoRestante,
    porcentajeGastado: Math.min(100, Math.round(porcentajeGastado)),
    teDeben,
    debes,
  };

  return { resumen, deudasPorPersona };
};

export const formatearMoneda = (monto: number, simbolo: string = '$'): string => {
  return `${simbolo} ${monto.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};
