/* =============================================================================
  SCHEMA DO BANCO DE DADOS - SISTEMA DE BID LOGÍSTICO (SaaS)
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
  lance_vencedor_id uuid,
  log_encerramento text
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

-- 2. FUNÇÕES HELPER DE SEGURANÇA
-- ============================================================================

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

-- >>> ADMINS <<<
create policy "Admins podem ver lista de admins"
on public.admins for select
to authenticated
using (true);

create policy "Gestão de admins" 
on public.admins for all 
using ( auth.uid() = auth_id or public.is_master() );

-- >>> TRANSPORTADORAS <<<
create policy "Acesso tabela transportadoras" 
on public.transportadoras for all 
using ( auth.uid() = auth_id or public.is_admin() );

-- >>> PÁTIOS <<<
create policy "Todos leem patios" 
on public.patios for select 
using ( true );

create policy "Admins gerenciam patios" 
on public.patios for all 
using ( public.is_admin() );

-- >>> BIDS <<<
create policy "Todos leem bids" 
on public.bids for select 
using ( true );

create policy "Admins criam BIDs"
on public.bids for insert
to authenticated
with check (
  exists ( select 1 from public.admins where auth_id = auth.uid() )
);

create policy "Admins editam BIDs"
on public.bids for update
to authenticated
using (
  exists ( select 1 from public.admins where auth_id = auth.uid() )
);

create policy "Master deleta BIDs"
on public.bids for delete
to authenticated
using ( public.is_master() );

-- >>> LANCES <<<
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

create policy "Fotos sao publicas"
on storage.objects for select
using ( bucket_id = 'veiculos' );

create policy "Admins gerenciam fotos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'veiculos' 
  and exists ( select 1 from public.admins where auth_id = auth.uid() )
);

create policy "Admins deletam fotos"
on storage.objects for delete
using ( bucket_id = 'veiculos' and public.is_admin() );