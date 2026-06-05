# Sistem Pakar Analisis Minat Belajar Siswa

Aplikasi dashboard sistem pakar untuk analisis minat belajar siswa menggunakan **Forward Chaining** dan **ID3 Decision Tree**.

Stack:
- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Vercel

## Fitur Utama

- Auth Supabase dengan route protection.
- Role guard untuk halaman admin.
- CRUD siswa.
- CRUD gejala.
- CRUD rules Forward Chaining dan mapping `rule_gejala`.
- CRUD dataset ID3.
- Konsultasi siswa dengan inference FC + ID3.
- Halaman hasil konsultasi dengan comparison FC vs ID3.
- Dashboard utama berbasis data real.
- Dashboard komparasi admin.
- Laporan dengan filter dan export CSV.

## Environment

Buat `.env.local` berdasarkan `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://ickfwovdyhrcnixvcpyr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Catatan:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` dipakai client/server Supabase normal.
- `SUPABASE_SERVICE_ROLE_KEY` hanya boleh digunakan server-side.
- Jangan commit `.env.local`.

## Supabase Setup

Jalankan SQL dengan urutan:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed/001_initial_seed.sql`

Cara cepat:

1. Buka Supabase Dashboard.
2. Masuk ke project `ickfwovdyhrcnixvcpyr`.
3. Buka SQL Editor.
4. Paste dan jalankan migration.
5. Paste dan jalankan seed.
6. Buat user pertama di Authentication.
7. Set user pertama menjadi admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin Sekolah'
where id = '<USER_UUID_DARI_AUTH_USERS>';
```

Detail tambahan ada di `supabase/README.md`.

## Menjalankan Lokal

Install dependency:

```bash
npm install
```

Jalankan dev server:

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

Route `/` akan redirect ke `/dashboard`. Jika belum login, middleware akan mengarahkan ke `/login`.

## Validasi

Lint:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Start hasil build:

```bash
npm run start
```

## Route Penting

- `/login` - login Supabase.
- `/dashboard` - overview sistem.
- `/siswa` - data siswa.
- `/konsultasi/new` - kuesioner konsultasi.
- `/konsultasi/[id]/hasil` - hasil FC + ID3.
- `/laporan` - laporan dan export CSV.
- `/admin/gejala` - master gejala.
- `/admin/rules` - rules Forward Chaining.
- `/admin/dataset` - dataset training ID3.
- `/admin/comparison` - dashboard komparasi FC vs ID3.
- `/api/laporan/export` - export laporan CSV.

## Deployment

Target deployment:
- Frontend: Vercel
- Backend: Supabase Cloud

Checklist Vercel:

1. Push repo ke GitHub.
2. Import project di Vercel.
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Pastikan Supabase migration dan seed sudah dijalankan.
5. Deploy.
6. Smoke test:
   - Login.
   - Akses `/dashboard`.
   - Cek `/admin/gejala` dengan user admin.
   - Buat konsultasi baru.
   - Buka hasil konsultasi.
   - Export laporan CSV.

## Catatan Implementasi

- Engine FC, ID3, dan comparison berada di `src/lib/engine/*` dan hanya dipakai server-side.
- Data inference disimpan di `hasil_diagnosa`.
- Dataset ID3 memakai format `fitur` JSON, contoh:

```json
{
  "G001": true,
  "G002": true,
  "G004": true
}
```

- Rule FC memakai tabel `rules_fc` dan pivot `rule_gejala`.
- RLS di Supabase wajib aktif sesuai migration.
