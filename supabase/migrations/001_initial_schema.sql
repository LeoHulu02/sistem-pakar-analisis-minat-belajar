-- Sistem Pakar Analisis Minat Belajar initial database schema
-- Run this file in Supabase SQL Editor or through Supabase CLI.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'siswa' check (role in ('admin', 'guru', 'siswa')),
  created_at timestamptz not null default now()
);

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'guru'), false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), 'User'),
    coalesce(new.raw_user_meta_data ->> 'role', 'siswa')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------------

create table if not exists public.siswa (
  id uuid primary key default gen_random_uuid(),
  nis text not null unique,
  nama text not null,
  kelas text not null,
  jenis_kelamin text check (jenis_kelamin in ('L', 'P')),
  tahun_ajaran text not null,
  profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_siswa_updated_at on public.siswa;
create trigger set_siswa_updated_at
  before update on public.siswa
  for each row execute function public.set_updated_at();

create table if not exists public.gejala (
  id uuid primary key default gen_random_uuid(),
  kode text not null unique,
  deskripsi text not null,
  kategori text,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rules_fc (
  id uuid primary key default gen_random_uuid(),
  kode_rule text not null unique,
  nama_rule text not null,
  kesimpulan text not null,
  bobot numeric(4,2) not null default 1.00 check (bobot > 0),
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rule_gejala (
  rule_id uuid not null references public.rules_fc(id) on delete cascade,
  gejala_id uuid not null references public.gejala(id) on delete cascade,
  primary key (rule_id, gejala_id)
);

-- ---------------------------------------------------------------------------
-- Consultation flow
-- ---------------------------------------------------------------------------

create table if not exists public.konsultasi (
  id uuid primary key default gen_random_uuid(),
  siswa_id uuid not null references public.siswa(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'selesai')),
  catatan text,
  created_at timestamptz not null default now()
);

create table if not exists public.konsultasi_gejala (
  konsultasi_id uuid not null references public.konsultasi(id) on delete cascade,
  gejala_id uuid not null references public.gejala(id) on delete restrict,
  primary key (konsultasi_id, gejala_id)
);

create table if not exists public.hasil_diagnosa (
  id uuid primary key default gen_random_uuid(),
  konsultasi_id uuid not null unique references public.konsultasi(id) on delete cascade,
  fc_kesimpulan text,
  fc_confidence numeric(5,2) check (fc_confidence between 0 and 100),
  fc_rules_matched jsonb not null default '[]'::jsonb,
  id3_kesimpulan text,
  id3_confidence numeric(5,2) check (id3_confidence between 0 and 100),
  id3_path jsonb not null default '[]'::jsonb,
  agreement boolean,
  final_kesimpulan text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ID3 dataset and comparison aggregate
-- ---------------------------------------------------------------------------

create table if not exists public.dataset_id3 (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  fitur jsonb not null,
  tahun_ajaran text,
  created_at timestamptz not null default now()
);

create table if not exists public.comparison_results (
  id uuid primary key default gen_random_uuid(),
  periode text not null,
  total_konsultasi int not null default 0 check (total_konsultasi >= 0),
  fc_akurasi numeric(5,2) check (fc_akurasi between 0 and 100),
  id3_akurasi numeric(5,2) check (id3_akurasi between 0 and 100),
  agreement_rate numeric(5,2) check (agreement_rate between 0 and 100),
  computed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index if not exists siswa_profile_id_idx on public.siswa(profile_id);
create index if not exists siswa_kelas_idx on public.siswa(kelas);
create index if not exists siswa_tahun_ajaran_idx on public.siswa(tahun_ajaran);
create index if not exists gejala_aktif_idx on public.gejala(aktif);
create index if not exists rules_fc_aktif_idx on public.rules_fc(aktif);
create index if not exists rules_fc_kesimpulan_idx on public.rules_fc(kesimpulan);
create index if not exists konsultasi_siswa_id_idx on public.konsultasi(siswa_id);
create index if not exists konsultasi_created_by_idx on public.konsultasi(created_by);
create index if not exists konsultasi_created_at_idx on public.konsultasi(created_at desc);
create index if not exists hasil_diagnosa_final_kesimpulan_idx on public.hasil_diagnosa(final_kesimpulan);
create index if not exists dataset_id3_label_idx on public.dataset_id3(label);
create index if not exists dataset_id3_fitur_gin_idx on public.dataset_id3 using gin(fitur);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.siswa enable row level security;
alter table public.gejala enable row level security;
alter table public.rules_fc enable row level security;
alter table public.rule_gejala enable row level security;
alter table public.konsultasi enable row level security;
alter table public.konsultasi_gejala enable row level security;
alter table public.hasil_diagnosa enable row level security;
alter table public.dataset_id3 enable row level security;
alter table public.comparison_results enable row level security;

-- profiles
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- siswa
drop policy if exists "siswa_select_staff_or_self" on public.siswa;
create policy "siswa_select_staff_or_self"
on public.siswa for select
to authenticated
using (public.is_staff() or profile_id = auth.uid());

drop policy if exists "siswa_staff_insert" on public.siswa;
create policy "siswa_staff_insert"
on public.siswa for insert
to authenticated
with check (public.is_staff());

drop policy if exists "siswa_staff_update" on public.siswa;
create policy "siswa_staff_update"
on public.siswa for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "siswa_staff_delete" on public.siswa;
create policy "siswa_staff_delete"
on public.siswa for delete
to authenticated
using (public.is_staff());

-- gejala
drop policy if exists "gejala_read_authenticated" on public.gejala;
create policy "gejala_read_authenticated"
on public.gejala for select
to authenticated
using (true);

drop policy if exists "gejala_admin_write" on public.gejala;
create policy "gejala_admin_write"
on public.gejala for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- rules_fc
drop policy if exists "rules_fc_read_authenticated" on public.rules_fc;
create policy "rules_fc_read_authenticated"
on public.rules_fc for select
to authenticated
using (true);

drop policy if exists "rules_fc_admin_write" on public.rules_fc;
create policy "rules_fc_admin_write"
on public.rules_fc for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- rule_gejala
drop policy if exists "rule_gejala_read_authenticated" on public.rule_gejala;
create policy "rule_gejala_read_authenticated"
on public.rule_gejala for select
to authenticated
using (true);

drop policy if exists "rule_gejala_admin_write" on public.rule_gejala;
create policy "rule_gejala_admin_write"
on public.rule_gejala for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- konsultasi
drop policy if exists "konsultasi_select_staff_or_owner" on public.konsultasi;
create policy "konsultasi_select_staff_or_owner"
on public.konsultasi for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.siswa s
    where s.id = konsultasi.siswa_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "konsultasi_insert_staff_or_owner" on public.konsultasi;
create policy "konsultasi_insert_staff_or_owner"
on public.konsultasi for insert
to authenticated
with check (
  public.is_staff()
  or exists (
    select 1
    from public.siswa s
    where s.id = siswa_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "konsultasi_staff_update" on public.konsultasi;
create policy "konsultasi_staff_update"
on public.konsultasi for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

drop policy if exists "konsultasi_staff_delete" on public.konsultasi;
create policy "konsultasi_staff_delete"
on public.konsultasi for delete
to authenticated
using (public.is_staff());

-- konsultasi_gejala
drop policy if exists "konsultasi_gejala_select_via_konsultasi" on public.konsultasi_gejala;
create policy "konsultasi_gejala_select_via_konsultasi"
on public.konsultasi_gejala for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.konsultasi k
    join public.siswa s on s.id = k.siswa_id
    where k.id = konsultasi_gejala.konsultasi_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "konsultasi_gejala_insert_via_konsultasi" on public.konsultasi_gejala;
create policy "konsultasi_gejala_insert_via_konsultasi"
on public.konsultasi_gejala for insert
to authenticated
with check (
  public.is_staff()
  or exists (
    select 1
    from public.konsultasi k
    join public.siswa s on s.id = k.siswa_id
    where k.id = konsultasi_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "konsultasi_gejala_staff_delete" on public.konsultasi_gejala;
create policy "konsultasi_gejala_staff_delete"
on public.konsultasi_gejala for delete
to authenticated
using (public.is_staff());

-- hasil_diagnosa
drop policy if exists "hasil_select_via_konsultasi" on public.hasil_diagnosa;
create policy "hasil_select_via_konsultasi"
on public.hasil_diagnosa for select
to authenticated
using (
  public.is_staff()
  or exists (
    select 1
    from public.konsultasi k
    join public.siswa s on s.id = k.siswa_id
    where k.id = hasil_diagnosa.konsultasi_id
      and s.profile_id = auth.uid()
  )
);

drop policy if exists "hasil_staff_write" on public.hasil_diagnosa;
create policy "hasil_staff_write"
on public.hasil_diagnosa for all
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- dataset_id3
drop policy if exists "dataset_id3_admin_all" on public.dataset_id3;
create policy "dataset_id3_admin_all"
on public.dataset_id3 for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

-- comparison_results
drop policy if exists "comparison_results_staff_select" on public.comparison_results;
create policy "comparison_results_staff_select"
on public.comparison_results for select
to authenticated
using (public.is_staff());

drop policy if exists "comparison_results_admin_write" on public.comparison_results;
create policy "comparison_results_admin_write"
on public.comparison_results for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
