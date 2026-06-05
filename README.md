# Sanu

Dashboard sistem pakar untuk membantu analisis minat belajar siswa berbasis **Forward Chaining** dan **ID3 Decision Tree**.

Aplikasi ini menggabungkan manajemen data siswa, basis pengetahuan, dataset training, proses konsultasi, hasil diagnosa, komparasi metode, dan laporan dalam satu dashboard admin yang ringan.

## Tech Stack

- **Next.js 14** dengan App Router
- **TypeScript**
- **Tailwind CSS**
- **Supabase Auth + PostgreSQL**
- **Forward Chaining** untuk inference berbasis rules
- **ID3 Decision Tree** untuk klasifikasi berbasis dataset

## Fitur

- Login Supabase dengan route protection.
- Role guard untuk akses admin.
- Dashboard ringkas untuk memantau data utama.
- CRUD data siswa.
- CRUD gejala.
- CRUD rules Forward Chaining dan mapping `rule_gejala`.
- CRUD dataset ID3.
- Konsultasi siswa dengan hasil FC + ID3.
- Halaman hasil konsultasi dengan comparison antar metode.
- Dashboard komparasi admin.
- Laporan dengan filter dan export CSV.

## Quick Start

Install dependency:

```bash
npm install
```

Siapkan environment lokal:

```bash
cp .env.example .env.local
```

Isi `.env.local` dengan value dari Supabase project kamu:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

Jalankan development server:

```bash
npm run dev
```

Buka `http://localhost:3000`. Route `/` akan diarahkan ke `/dashboard`, dan user yang belum login akan diarahkan ke `/login`.

## Environment Safety

- Jangan commit `.env.local`.
- Jangan taruh value asli API key, anon key, service role key, token, atau password di README.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` boleh dipakai oleh client, tapi tetap jangan ditempel di dokumentasi publik.
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh dipakai server-side dan wajib dianggap rahasia.

## Supabase Setup

Jalankan file SQL berikut secara berurutan:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed/001_initial_seed.sql`

Setelah user pertama dibuat lewat Supabase Authentication, jadikan user tersebut admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin Sekolah'
where id = '<USER_UUID_DARI_AUTH_USERS>';
```

Detail setup database ada di `supabase/README.md`.

## Struktur Aplikasi

- `src/app/(auth)/login` - halaman login.
- `src/app/(app)/dashboard` - dashboard utama.
- `src/app/(app)/siswa` - master data siswa.
- `src/app/(app)/konsultasi` - flow konsultasi dan hasil.
- `src/app/(app)/laporan` - laporan dan export CSV.
- `src/app/(app)/admin/gejala` - master gejala.
- `src/app/(app)/admin/rules` - basis rules Forward Chaining.
- `src/app/(app)/admin/dataset` - dataset training ID3.
- `src/app/(app)/admin/comparison` - komparasi hasil FC dan ID3.
- `src/lib/engine` - engine inference dan comparison.
- `supabase` - migration dan seed database.

## Script

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Validasi

Sebelum deploy, jalankan:

```bash
npm run lint
npm run build
```

Smoke test minimal:

- Login berhasil.
- Dashboard bisa dibuka.
- Admin bisa mengakses `/admin/gejala`.
- Konsultasi baru bisa dibuat.
- Halaman hasil konsultasi tampil.
- Export laporan CSV berjalan.

## Deployment

Target umum:

- Frontend: Vercel
- Backend: Supabase Cloud

Checklist:

1. Push repository ke GitHub.
2. Import project ke Vercel.
3. Set environment variables di Vercel.
4. Jalankan migration dan seed di Supabase.
5. Deploy.
6. Smoke test route utama.

## Catatan Engine

- Forward Chaining memakai `rules_fc` dan pivot `rule_gejala`.
- ID3 memakai dataset dengan kolom `fitur` berbentuk JSON.
- Hasil inference disimpan di `hasil_diagnosa`.
- RLS Supabase wajib aktif sesuai migration.
