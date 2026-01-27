/* =============================================================================
  SCHEMA DO BANCO DE DADOS - SISTEMA DE BID LOGÍSTICO (SaaS)
  -----------------------------------------------------------------------------
  Este script contém a definição completa da estrutura do banco de dados,
  incluindo tabelas, funções de segurança, RLS (Row Level Security) e Storage.
  =============================================================================
*/

-- 1. TABELAS (ESTRUTURA DE DADOS)
-- ============================================================================

create table if not exists public.admins (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  email text not null unique,
  usuario text,
  senha text,
  role text default 'standard',
  auth_id uuid references auth.users(id)
);

create table if not exists public.transportadoras (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  email text not null unique,
  usuario text,
  senha text,
  auth_id uuid references auth.users(id)
);

create table if not exists public.patios (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  endereco text not null
);

create table if not exists public.bids (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  codigo_unico text not null,
  titulo text not null,
  descricao text,
  origem text not null,
  destino text not null,
  categoria_veiculo text,
  tipo_transporte text,
  prazo_limite timestamp with time zone not null,
  status text default 'ABERTO',
  imagem_url text,
  vencedor_id uuid,
  lance_vencedor_id uuid
);

create table if not exists public.lances (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  bid_id uuid references public.bids(id) not null,
  transportadora_nome text not null,
  valor numeric not null,
  prazo_dias integer not null,
  auth_id uuid references auth.users(id)
);

-- 2. FUNÇÕES HELPER DE SEGURANÇA (SECURITY DEFINER)
-- ============================================================================
-- Essas funções evitam o "Loop Infinito" (Recursão) nas políticas RLS.
-- Elas rodam com privilégios de superusuário para checar cargos rapidamente.

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.admins
    where auth_id = auth.uid()
  );
$$ language sql security definer;

create or replace function public.is_master()
returns boolean as $$
  select exists (
    select 1 from public.admins
    where auth_id = auth.uid() and role = 'master'
  );
$$ language sql security definer;

create or replace function public.is_transportadora()
returns boolean as $$
  select exists (
    select 1 from public.transportadoras
    where auth_id = auth.uid()
  );
$$ language sql security definer;

-- 3. HABILITANDO RLS (ROW LEVEL SECURITY)
-- ============================================================================

alter table public.admins enable row level security;
alter table public.transportadoras enable row level security;
alter table public.patios enable row level security;
alter table public.bids enable row level security;
alter table public.lances enable row level security;

-- 4. POLÍTICAS DE ACESSO (POLICIES)
-- ============================================================================

drop policy if exists "Acesso tabela admins" on public.admins;
drop policy if exists "Acesso tabela transportadoras" on public.transportadoras;
drop policy if exists "Todos leem patios" on public.patios;
drop policy if exists "Admins gerenciam patios" on public.patios;
drop policy if exists "Todos leem bids" on public.bids;
drop policy if exists "Admins gerenciam bids" on public.bids;
drop policy if exists "Todos leem lances" on public.lances;
drop policy if exists "Transportadora insere lances" on public.lances;
drop policy if exists "Admins gerenciam lances" on public.lances;

create policy "Acesso tabela admins" 
on public.admins for all 
using ( auth.uid() = auth_id or public.is_master() );

create policy "Acesso tabela transportadoras" 
on public.transportadoras for all 
using ( auth.uid() = auth_id or public.is_admin() );

create policy "Todos leem patios" 
on public.patios for select 
using ( true );

create policy "Admins gerenciam patios" 
on public.patios for all 
using ( public.is_admin() );

create policy "Todos leem bids" 
on public.bids for select 
using ( true );

create policy "Admins gerenciam bids" 
on public.bids for all 
using ( public.is_admin() );

create policy "Todos leem lances" 
on public.lances for select 
using ( true );

create policy "Transportadora insere lances" 
on public.lances for insert 
with check ( public.is_transportadora() );

create policy "Admins gerenciam lances" 
on public.lances for all 
using ( public.is_admin() );

-- 5. STORAGE (ARMAZENAMENTO DE FOTOS)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('veiculos', 'veiculos', true)
on conflict (id) do nothing;

drop policy if exists "Fotos sao publicas" on storage.objects;
drop policy if exists "Apenas Admins gerenciam fotos" on storage.objects;
drop policy if exists "Apenas Admins deletam fotos" on storage.objects;

create policy "Fotos sao publicas"
on storage.objects for select
using ( bucket_id = 'veiculos' );

create policy "Apenas Admins gerenciam fotos"
on storage.objects for insert
with check ( bucket_id = 'veiculos' and public.is_admin() );

create policy "Apenas Admins deletam fotos"
on storage.objects for delete
using ( bucket_id = 'veiculos' and public.is_admin() );