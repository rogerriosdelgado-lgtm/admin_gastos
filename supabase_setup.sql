-- ==============================================================
-- LIMPIEZA DE TABLAS ANTERIORES DEL PROYECTO PREVIO (ArA)
-- Y CONFIGURACIÓN COMPLETA PARA APP DE GASTOS Y DIVISIÓN
-- ==============================================================

-- 1. Eliminar tablas antiguas de proyectos anteriores si existen
drop table if exists public.appointments cascade;
drop table if exists public.availabilities cascade;
drop table if exists public.services cascade;

-- Eliminar tablas de gastos si se desea recrear desde cero
drop table if exists public.liquidaciones cascade;
drop table if exists public.gasto_items cascade;
drop table if exists public.gasto_divisiones cascade;
drop table if exists public.gastos cascade;
drop table if exists public.participantes_externos cascade;
drop table if exists public.ingresos cascade;
drop table if exists public.profiles cascade;

-- ==============================================================
-- 2. CREACIÓN DE TABLAS NUEVAS
-- ==============================================================

-- A. Perfiles de Usuario (vinculados a la autenticación de Supabase)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nombre text not null,
  email text,
  pin_hash text,
  moneda text default '$',
  biometria_activa boolean default true,
  created_at timestamptz default now()
);

-- Trigger para crear perfil automáticamente al registrarse en Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nombre, email, pin_hash, biometria_activa)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'pin_hash',
    coalesce((new.raw_user_meta_data->>'biometria_activa')::boolean, true)
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    email = excluded.email;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- B. Ingresos / Sueldo mensual
create table public.ingresos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users on delete cascade not null,
  concepto text not null,
  monto numeric not null check (monto > 0),
  tipo text not null default 'sueldo', -- 'sueldo', 'extra'
  fecha date default current_date not null,
  mes integer not null,
  anio integer not null,
  created_at timestamptz default now()
);

-- C. Participantes Externos (amigos o contactos que no tienen la app)
create table public.participantes_externos (
  id uuid primary key default gen_random_uuid(),
  creado_por uuid references auth.users on delete cascade not null,
  nombre text not null,
  created_at timestamptz default now()
);

-- D. Tabla Principal de Gastos (Personales o Compartidos)
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users on delete cascade not null,
  titulo text not null,
  monto_total numeric not null check (monto_total >= 0),
  tipo_gasto text not null default 'personal', -- 'personal', 'compartido_simple', 'compartido_desglosado'
  categoria text not null default 'variable', -- 'fijo', 'variable', 'gusto'
  pagado_por_mi boolean default true,
  pagado_por_nombre text default 'Yo',
  fecha date default current_date not null,
  mes integer not null,
  anio integer not null,
  notas text,
  created_at timestamptz default now()
);

-- E. Divisiones del Gasto (Montos asignados a cada participante)
create table public.gasto_divisiones (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid references public.gastos on delete cascade not null,
  nombre_participante text not null,
  es_usuario_actual boolean default false,
  monto_asignado numeric not null check (monto_asignado >= 0),
  created_at timestamptz default now()
);

-- F. Ítems desglosados de facturas / tickets (Comida, cervezas, productos de super)
create table public.gasto_items (
  id uuid primary key default gen_random_uuid(),
  gasto_id uuid references public.gastos on delete cascade not null,
  descripcion text not null,
  precio numeric not null check (precio >= 0),
  asignado_a text[] not null default '{}',
  created_at timestamptz default now()
);

-- G. Liquidaciones de Deuda (Pagos para dejar cuentas en cero)
create table public.liquidaciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references auth.users on delete cascade not null,
  de_nombre text not null,
  para_nombre text not null,
  monto numeric not null check (monto > 0),
  fecha date default current_date not null,
  notas text,
  created_at timestamptz default now()
);

-- ==============================================================
-- 3. POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ==============================================================
alter table public.profiles enable row level security;
alter table public.ingresos enable row level security;
alter table public.participantes_externos enable row level security;
alter table public.gastos enable row level security;
alter table public.gasto_divisiones enable row level security;
alter table public.gasto_items enable row level security;
alter table public.liquidaciones enable row level security;

create policy "Usuarios gestionan su perfil"
  on public.profiles for all using (auth.uid() = id);

create policy "Usuarios gestionan sus ingresos"
  on public.ingresos for all using (auth.uid() = usuario_id);

create policy "Usuarios gestionan sus contactos externos"
  on public.participantes_externos for all using (auth.uid() = creado_por);

create policy "Usuarios gestionan sus gastos"
  on public.gastos for all using (auth.uid() = usuario_id);

create policy "Usuarios gestionan divisiones de sus gastos"
  on public.gasto_divisiones for all using (
    exists (select 1 from public.gastos g where g.id = gasto_divisiones.gasto_id and g.usuario_id = auth.uid())
  );

create policy "Usuarios gestionan items de sus gastos"
  on public.gasto_items for all using (
    exists (select 1 from public.gastos g where g.id = gasto_items.gasto_id and g.usuario_id = auth.uid())
  );

create policy "Usuarios gestionan sus liquidaciones"
  on public.liquidaciones for all using (auth.uid() = usuario_id);
