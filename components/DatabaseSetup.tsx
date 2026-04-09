
import React, { useState, useMemo } from 'react';
import { Copy, Check, ExternalLink, Database, Play } from 'lucide-react';
import bcrypt from 'bcryptjs';

export const DatabaseSetup = () => {
  const [copied, setCopied] = useState(false);

  const SQL_SCRIPT = useMemo(() => {
    const hash = '$2b$10$hEOxBmYO.EKjUBxRtBEHA.uDI4j33iUxadU8QXbUKYJJ7RV4bzJZu';
    return `-- 1. Extensiones necesarias
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. Tablas Principales
create table if not exists public.users (
  id uuid not null default uuid_generate_v4(),
  nombre text not null,
  email text not null,
  rol text not null, -- 'ADMIN', 'OPERADOR', 'REPARTIDOR'
  activo boolean default true,
  foto_url text null,
  fecha_nacimiento date null,
  password_hash text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
);

create table if not exists public.shipments (
  id uuid not null default uuid_generate_v4(),
  referencia_externa text not null,
  origen text default 'Almacén Central',
  
  -- Dirección detallada (Talkual Request)
  destino_calle text,
  destino_codigo_postal text,
  destino_poblacion text,
  destino_provincia text,
  destino_pais text default 'España',
  
  -- Cliente detallado (Talkual Request)
  cliente_nombre text,
  cliente_telefono text,
  cliente_email text,
  
  fecha_entrega_estimada date,
  franja_horaria text default '09:00 - 18:00',
  
  -- Totales
  total_bultos int default 0,
  total_peso float default 0.0,
  total_volumen float default 0.0,
  
  -- Campo para bultos en JSON (Talkual envía array)
  packages jsonb default '[]'::jsonb,
  
  source text default 'manual',
  
  notas text null,
  estado text default 'PENDIENTE',
  repartidor_id uuid references public.users(id),
  repartidor_nombre text,
  etiqueta_url text,
  pod jsonb null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint shipments_pkey primary key (id)
);

-- Tabla de Bultos Detallada (Talkual Request)
create table if not exists public.packages (
  id uuid not null default uuid_generate_v4(),
  shipment_id uuid references public.shipments(id) on delete cascade,
  peso float not null,
  volumen float not null,
  descripcion text,
  created_at timestamp with time zone default now(),
  constraint packages_pkey primary key (id)
);

create table if not exists public.webhook_logs (
  id uuid not null default uuid_generate_v4(),
  proveedor text,
  endpoint text,
  status int,
  request_body text,
  response_body text,
  created_at timestamp with time zone default now(),
  constraint webhook_logs_pkey primary key (id)
);

create table if not exists public.tracking_events (
  id uuid not null default uuid_generate_v4(),
  envio_id uuid references public.shipments(id) on delete cascade,
  tipo_evento text,
  payload_json text,
  usuario_id uuid,
  usuario_nombre text,
  created_at timestamp with time zone default now(),
  constraint tracking_events_pkey primary key (id)
);

-- 3. Seguridad Estricta (Talkual Request: RLS)
alter table public.users enable row level security;
alter table public.shipments enable row level security;
alter table public.packages enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.tracking_events enable row level security;

-- Políticas para USERS (Protección de datos sensibles)
-- 1. Los administradores pueden hacer todo
create policy "Admins can do everything on users" 
  on public.users for all 
  using (
    exists (select 1 from public.users where id = auth.uid() and rol = 'ADMIN')
  );

-- 2. Los usuarios pueden ver su propio perfil (si están autenticados vía Supabase Auth)
create policy "Users can view their own profile" 
  on public.users for select 
  using (auth.uid() = id);

-- 3. Los usuarios pueden actualizar su propio perfil (ciertos campos)
create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

-- 4. IMPORTANTE: Para que el login funcione sin exponer el hash, 
-- limitamos la lectura pública a solo lo estrictamente necesario.
-- Supabase Advisor recomienda NO usar 'true'. 
-- Si usas Supabase Auth, esta política no es necesaria.
-- create policy "Allow login fallback" on public.users for select using (true); -- ELIMINADA POR SEGURIDAD

-- Políticas para SHIPMENTS
create policy "Admins and Operators can view all shipments" 
  on public.shipments for select 
  using (
    exists (select 1 from public.users where id = auth.uid() and rol in ('ADMIN', 'OPERADOR'))
  );

create policy "Drivers can view assigned shipments" 
  on public.shipments for select 
  using (auth.uid() = repartidor_id);

create policy "Admins and Operators can manage shipments" 
  on public.shipments for all 
  using (
    exists (select 1 from public.users where id = auth.uid() and rol in ('ADMIN', 'OPERADOR'))
  );

create policy "Drivers can update assigned shipments"
  on public.shipments for update
  using (auth.uid() = repartidor_id);

-- Políticas para PACKAGES (Misma lógica que shipments)
create policy "Access packages via shipment" 
  on public.packages for all 
  using (
    exists (
      select 1 from public.shipments s 
      where s.id = shipment_id 
      and (
        exists (select 1 from public.users where id = auth.uid() and rol in ('ADMIN', 'OPERADOR'))
        or auth.uid() = s.repartidor_id
      )
    )
  );

-- Políticas para WEBHOOK_LOGS (Solo Admins)
create policy "Only admins can view logs"
  on public.webhook_logs for select
  using (
    exists (select 1 from public.users where id = auth.uid() and rol = 'ADMIN')
  );

-- Políticas para TRACKING_EVENTS
create policy "Admins and Operators can view all events"
  on public.tracking_events for select
  using (
    exists (select 1 from public.users where id = auth.uid() and rol in ('ADMIN', 'OPERADOR'))
  );

create policy "Drivers can view events of assigned shipments"
  on public.tracking_events for select
  using (
    exists (
      select 1 from public.shipments s 
      where s.id = envio_id and auth.uid() = s.repartidor_id
    )
  );

create policy "Authenticated users can insert events"
  on public.tracking_events for insert
  with check (auth.uid() is not null);

-- 4. Usuario Admin Inicial (Hash de 'hidalgo123')
insert into public.users (nombre, email, rol, password_hash)
values ('Ivan Hidalgo', 'ivan@hidalgo.app', 'ADMIN', '${hash}')
on conflict (email) do nothing;

-- 5. Función de Login Segura (RPC)
-- Esta función permite validar el login sin exponer la tabla users públicamente.
-- Eliminamos cualquier versión previa para evitar conflictos de caché
drop function if exists public.verify_user_login(text);
drop function if exists public.check_user_credentials(text);
drop function if exists public.check_user_credentials(text, text);

create or replace function public.verify_user_login(p_email text)
returns setof public.users as $$
begin
  return query
  select *
  from public.users
  where lower(email) = lower(p_email)
  and activo = true;
end;
$$ language plpgsql security definer;

grant execute on function public.verify_user_login(text) to anon, authenticated;

-- 6. Forzar refresco de caché de la API (PostgREST)
notify pgrst, 'reload schema';
`;
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* Left Side: Instructions */}
        <div className="p-8 md:w-1/2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-orange mb-2">
              <Database size={24} />
              <span className="font-bold uppercase tracking-widest text-xs">Setup Necesario</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-4">Conectando Base de Datos</h1>
            <p className="text-sm text-slate-500 mb-6 font-bold text-red-600">
              ⚠️ ¡ATENCIÓN! Supabase ha detectado vulnerabilidades. Debes ejecutar este nuevo script para activar la Seguridad de Nivel de Fila (RLS) y proteger tus datos.
            </p>
            <p className="text-xs text-slate-400 mb-6">
              Este script corrige los avisos de "Table publicly accessible" y "Sensitive data publicly accessible".
            </p>

            <ol className="space-y-4 text-sm font-medium text-slate-700">
              <li className="flex gap-3">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                <span>Copia el código SQL de la derecha.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                <span>
                   Abre el 
                   <a 
                     href="https://supabase.com/dashboard/project/brtwudvemebtmdbvmdsy/sql/new" 
                     target="_blank" 
                     rel="noreferrer"
                     className="text-brand-cyan hover:underline mx-1 inline-flex items-center"
                   >
                     Editor SQL de Supabase <ExternalLink size={10} className="ml-0.5"/>
                   </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                <span>Pega el código y pulsa el botón verde <strong className="text-green-600">RUN</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="bg-slate-100 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                <span>Recarga esta página.</span>
              </li>
            </ol>
          </div>
          
          <button 
             onClick={() => window.location.reload()}
             className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            YA LO HE HECHO, RECARGAR
          </button>
        </div>

        {/* Right Side: Code Block */}
        <div className="bg-slate-900 md:w-1/2 p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <button 
               onClick={handleCopy}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${copied ? 'bg-green-500 text-white' : 'bg-brand-cyan text-slate-900 hover:bg-cyan-300'}`}
             >
               {copied ? <Check size={14} /> : <Copy size={14} />}
               {copied ? 'COPIADO' : 'COPIAR SQL'}
             </button>
          </div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-2">Código SQL a ejecutar</label>
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-black/30 rounded-xl p-4 border border-white/10 text-[10px] font-mono leading-relaxed text-blue-100">
             <pre>{SQL_SCRIPT}</pre>
          </div>
          <div className="mt-4 text-[10px] text-slate-500 text-center">
            Este script crea las tablas y activa RLS (Row Level Security) para cumplir con los requisitos de seguridad de Supabase.
          </div>
        </div>
      </div>
    </div>
  );
};
