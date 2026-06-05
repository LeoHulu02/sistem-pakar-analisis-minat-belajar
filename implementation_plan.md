# Implementation Plan — Sistem Pakar Analisis Minat Belajar Siswa
> **Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Shadcn UI · Supabase · PostgreSQL · Vercel  
> **Metode:** Forward Chaining + ID3 Decision Tree  
> **Target:** Production-ready app untuk keperluan skripsi & deployment nyata

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [UI/UX Design System](#3-uiux-design-system)
4. [Modules Breakdown](#4-modules-breakdown)
5. [Database Design](#5-database-design)
6. [Engine Design](#6-engine-design)
7. [API Design](#7-api-design)
8. [Project Structure](#8-project-structure)
9. [Development Phases](#9-development-phases)
10. [MVP Definition](#10-mvp-definition)
11. [Execution Roadmap](#11-execution-roadmap)

---

## 1. System Overview

### Problem Statement

Banyak siswa di jenjang SMP/SMA tidak memiliki kejelasan terhadap minat belajar mereka. Guru BK atau wali kelas kesulitan mengidentifikasi secara sistematis bidang minat tiap siswa karena prosesnya manual dan tidak terdokumentasi.

### Solution

Aplikasi web berbasis **sistem pakar** yang:
1. Menerima input gejala/jawaban dari siswa melalui kuesioner
2. Menjalankan **Forward Chaining** untuk inferensi berbasis rule
3. Menjalankan **ID3 Decision Tree** untuk prediksi berbasis histori dataset
4. Mengkomparasi kedua hasil dan menampilkan confidence score
5. Menyimpan semua histori untuk analisis dan laporan admin/guru

### Konteks Sekolah

| Aktor | Peran |
|---|---|
| **Admin** | Kelola rule FC, training dataset ID3, kelola user |
| **Guru / Konselor** | Lihat hasil semua siswa, buat laporan, export data |
| **Siswa** | Isi kuesioner, lihat hasil rekomendasi minat belajar |

### Output Sistem

- Rekomendasi minat belajar: `IPA`, `IPS`, `Bahasa`, `Seni`, `Teknologi`, `Olahraga`, dst.
- Confidence level dari kedua metode
- Perbandingan hasil FC vs ID3
- Histori konsultasi per siswa

---

## 2. Architecture

### High-Level System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                      │
│   Next.js 14 App Router · React · Tailwind · Shadcn UI      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    NEXT.JS APP SERVER                        │
│   ┌─────────────────┐    ┌──────────────────────────────┐  │
│   │  Server Actions  │    │   Route Handlers (API)       │  │
│   │  /app/actions/  │    │   /app/api/...               │  │
│   └────────┬────────┘    └──────────┬───────────────────┘  │
│            │                        │                        │
│   ┌────────▼────────────────────────▼──────────────────┐   │
│   │             INFERENCE ENGINE (Server-side only)      │   │
│   │   ┌─────────────────┐  ┌────────────────────────┐  │   │
│   │   │ Forward Chaining │  │   ID3 Decision Tree    │  │   │
│   │   │  /lib/engine/fc │  │  /lib/engine/id3       │  │   │
│   │   └────────┬────────┘  └───────────┬────────────┘  │   │
│   └────────────┼────────────────────────┼───────────────┘   │
└────────────────┼────────────────────────┼───────────────────┘
                 │                        │
                 ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   SUPABASE CLOUD                             │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  Auth       │  │  PostgreSQL  │  │  Row Level         │ │
│  │  (email/pw) │  │  Database    │  │  Security (RLS)    │ │
│  └─────────────┘  └──────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Deployment)                       │
│   Edge Network · Serverless Functions · CI/CD dari GitHub   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow — Inference

```
[Siswa isi kuesioner]
         │
         ▼
[Simpan jawaban ke konsultasi]
         │
         ├──────────────────────────────────────┐
         ▼                                      ▼
[FC Engine]                              [ID3 Engine]
  - Load rules dari DB                    - Load dataset dari DB
  - Match gejala (facts) ke rules         - Build decision tree
  - Chain rule yang match                 - Traverse tree dengan input
  - Output: minat + matched rules         - Output: minat + confidence
         │                                      │
         └──────────────┬───────────────────────┘
                        ▼
              [Comparison Engine]
                - Bandingkan hasil FC vs ID3
                - Hitung agreement score
                - Tentukan final recommendation
                        │
                        ▼
              [Simpan hasil_diagnosa]
                        │
                        ▼
              [Return ke client untuk display]
```

### Auth Flow

```
[Login Page]
     │
     ▼
[Supabase Auth → email + password]
     │
     ├── Success → set session cookie → redirect ke /dashboard
     │
     └── Fail → show error inline (no toast spam)

[Middleware: /middleware.ts]
     - Cek session valid untuk semua route protected
     - Role check: admin routes → hanya role=admin
     - Redirect unauthorized ke /login
```

---

## 3. UI/UX Design System

### Design Philosophy

**Dense Modern Dashboard** — Terinspirasi dari Linear, Vercel, dan Notion.

Prinsip:
- **Information density tinggi** — tidak ada whitespace mubazir
- **Consistent spacing** — semua gap, padding menggunakan Tailwind scale (2/4/6/8)
- **No decorative elements** — tidak ada gradient background asal-asalan, tidak ada icon yang terlalu besar
- **Data-first** — tabel, angka, dan status badges selalu jadi visual center
- **Subtle depth** — shadow tipis (shadow-sm), border ringan (#e2e8f0), tidak ada card yang terlalu "puffy"

---

### Color System

```ts
// tailwind.config.ts — custom theme extension
const colors = {
  // Primary — Deep Indigo
  primary: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    500: '#6366f1',   // main CTA, active nav
    600: '#4f46e5',   // hover
    700: '#4338ca',   // pressed
    900: '#1e1b4b',   // dark sidebar bg
  },

  // Accent — Emerald (success, result positif)
  accent: {
    50:  '#ecfdf5',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
  },

  // Warning — Amber
  warning: {
    400: '#fbbf24',
    500: '#f59e0b',
  },

  // Error — Muted Red
  error: {
    400: '#f87171',
    500: '#ef4444',
    100: '#fee2e2',
  },

  // Neutral — Slate (background, borders, text)
  bg: {
    dark:     '#0f172a',   // dark mode root
    surface:  '#1e293b',   // dark card
    light:    '#f8fafc',   // light mode root
    card:     '#ffffff',   // light card
  },

  border: {
    light: '#e2e8f0',
    dark:  '#334155',
  },

  text: {
    primary:   '#0f172a',
    secondary: '#64748b',
    muted:     '#94a3b8',
    inverse:   '#f8fafc',
  }
}
```

**Penggunaan warna harus konsisten:**

| Konteks | Warna |
|---|---|
| CTA Button utama | `primary-600` |
| Active nav item | `primary-500` bg + `primary-100` text |
| Hasil FC/ID3 match | `accent-500` badge |
| Hasil tidak cocok | `warning-500` badge |
| Error / validation | `error-500` + `error-100` bg |
| Table row hover | `slate-50` |
| Confidence tinggi (>80%) | `accent` bar |
| Confidence sedang (50-79%) | `warning` bar |
| Confidence rendah (<50%) | `error` bar |

---

### Typography

```css
/* Font: Inter dari Google Fonts / next/font */
font-family: 'Inter', system-ui, -apple-system, sans-serif;

/* Hierarchy */
h1  — text-xl font-semibold tracking-tight     (page title)
h2  — text-base font-semibold                  (section title)
h3  — text-sm font-semibold text-slate-700     (card title)
p   — text-sm text-slate-600 leading-relaxed   (body)
label — text-xs font-medium text-slate-500     (form labels)
code  — font-mono text-xs bg-slate-100         (data/id)
```

---

### Layout Rules

**Desktop (≥1024px):**
```
┌──────────────────────────────────────────────────────────┐
│  TOPBAR  [Logo]  [Breadcrumb]         [User Avatar]      │  h-12
├────────┬─────────────────────────────────────────────────┤
│        │                                                  │
│ SIDE   │  MAIN CONTENT AREA                               │
│ BAR    │  - max-w-screen-xl mx-auto px-6                 │
│ w-56   │  - pt-6 pb-12                                   │
│        │  - grid-based layout                             │
│  nav   │                                                  │
│  items │                                                  │
│  icon  │                                                  │
│  +text │                                                  │
│        │                                                  │
└────────┴─────────────────────────────────────────────────┘
```

**Mobile (<768px):**
```
┌──────────────────────┐
│  TOPBAR minimal      │  h-12
├──────────────────────┤
│                      │
│  MAIN CONTENT        │
│  - full width        │
│  - px-4              │
│  - card stack        │
│  - table → cards     │
│                      │
├──────────────────────┤
│  BOTTOM NAV (5 tab)  │  h-14
│  icon + label kecil  │
└──────────────────────┘
```

---

### Component Style Guide

**Cards:**
```
rounded-lg border border-slate-200 bg-white p-4 shadow-sm
```
Tidak ada `shadow-xl`. Tidak ada `rounded-2xl` untuk data card.

**Buttons:**
```
Primary:   bg-primary-600 text-white hover:bg-primary-700 h-8 px-3 text-sm rounded-md
Secondary: border border-slate-200 bg-white hover:bg-slate-50 h-8 px-3 text-sm
Ghost:     hover:bg-slate-100 text-slate-600 h-8 px-2 text-sm
Danger:    bg-error-500 text-white hover:bg-error-600 h-8 px-3 text-sm
```

**Tables:**
```
- thead: bg-slate-50 text-xs font-medium text-slate-500 uppercase tracking-wider
- tbody tr: hover:bg-slate-50 border-b border-slate-100
- td: px-4 py-2.5 text-sm
- Tidak ada padding berlebih
```

**Badges / Status:**
```
Aktif:      bg-accent-50 text-accent-700 px-2 py-0.5 rounded text-xs font-medium
Pending:    bg-amber-50 text-amber-700 ...
Error:      bg-error-100 text-error-700 ...
Minat tag:  bg-primary-50 text-primary-700 ...
```

**Forms:**
```
Input:    border border-slate-200 rounded-md h-8 px-3 text-sm focus:ring-2 focus:ring-primary-500
Select:   same as input
Textarea: h-auto min-h-[80px]
Label:    text-xs font-medium text-slate-700 mb-1 block
Error:    text-xs text-error-500 mt-1
```

---

### Page Layouts (Description)

**Dashboard (`/dashboard`):**
- Row 1: 4 stat cards — Total Siswa, Konsultasi Hari Ini, Akurasi FC, Akurasi ID3
- Row 2: Chart distribusi minat (bar horizontal) + tabel konsultasi terbaru (5 row)
- Row 3: Recent activity feed (compact, 8 item max)

**Siswa List (`/siswa`):**
- Topbar: Search input + filter kelas + button "Tambah Siswa"
- Table dense: NIS | Nama | Kelas | Jurusan | Konsultasi Terakhir | Status | Actions
- Pagination bottom: 20 rows per page default
- Mobile: stack card dengan info ringkas + action button

**Kuesioner (`/konsultasi/new`):**
- Layout 1 kolom, center max-w-2xl
- Step indicator di atas (misal: Langkah 2 dari 4)
- Card per pertanyaan, radio dengan label jelas
- Progress bar tipis di atas
- Tidak scrolling ke bawah semua soal — satu per satu section

**Hasil (`/konsultasi/[id]/hasil`):**
- Hero section: Minat Utama + confidence score besar
- 2 kolom: hasil FC | hasil ID3
- Tabel perbandingan rule yang match
- Bar chart confidence per kategori
- Tombol: "Cetak" | "Konsultasi Ulang" | "Kembali"

**Admin Rule Manager (`/admin/rules`):**
- Split view: kiri list rule | kanan form edit/tambah
- Table rule: ID | Gejala | Kesimpulan | Bobot | Status
- Toggle aktif/nonaktif per rule tanpa reload halaman

---

## 4. Modules Breakdown

### 4.1 Auth Module

**Tanggung Jawab:**
- Login / Logout
- Session management via Supabase Auth
- Role-based access control (RBAC): `admin`, `guru`, `siswa`
- Route protection via Next.js middleware

**Pages:**
- `/login` — email + password form, no registration public
- `/auth/callback` — handle OAuth redirect (jika digunakan)

**Logic:**
- `createServerClient` dari `@supabase/ssr` untuk server components
- `createBrowserClient` untuk client components
- Middleware cek `session` + `role` dari `profiles` table
- Redirect rules: unauthenticated → `/login`, wrong role → `/unauthorized`

---

### 4.2 Student Module

**Tanggung Jawab:**
- CRUD data siswa
- Assign siswa ke kelas
- Lihat riwayat konsultasi per siswa
- Filter/search siswa

**Pages:**
- `/siswa` — list semua siswa
- `/siswa/[id]` — detail + riwayat
- `/siswa/new` — form tambah
- `/siswa/[id]/edit` — form edit

**Key Fields:** NIS, nama lengkap, kelas, jenis kelamin, tahun ajaran

---

### 4.3 Questionnaire Module

**Tanggung Jawab:**
- Menampilkan gejala/pertanyaan dalam format kuesioner
- Menyimpan jawaban sementara (state lokal)
- Submit ke inference engine
- Validasi minimal gejala yang dipilih

**Pages:**
- `/konsultasi/new` — flow kuesioner multi-step
- `/konsultasi/[id]/hasil` — halaman hasil

**Logic:**
- Pertanyaan dikelompokkan dalam kategori (minat)
- Jawaban disimpan sebagai array gejala_id yang dipilih
- Submit trigger server action `runInference(siswaId, gejalas[])`

---

### 4.4 Inference Engine Module

**Tanggung Jawab:**
- Menjalankan Forward Chaining
- Menjalankan ID3 Decision Tree
- Mengkomparasi hasil
- Menyimpan output ke database

**Location:** `/lib/engine/` — TIDAK ada di client bundle

**Sub-modules:**
- `fc.ts` — Forward Chaining engine
- `id3.ts` — ID3 Decision Tree builder + predictor
- `comparison.ts` — komparasi hasil FC & ID3
- `types.ts` — shared types untuk engine

---

### 4.5 Result Comparison Module

**Tanggung Jawab:**
- Menampilkan perbedaan/persamaan FC vs ID3
- Hitung agreement rate
- Visualisasi confidence bar
- Export ke PDF (opsional, fase akhir)

**Pages:**
- `/konsultasi/[id]/hasil` — full comparison view
- `/admin/comparison` — aggregate comparison report

---

### 4.6 Report Module

**Tanggung Jawab:**
- Rekap hasil semua siswa
- Filter per kelas, per periode
- Export CSV / PDF
- Statistik akurasi metode

**Pages:**
- `/laporan` — overview laporan
- `/laporan/export` — export handler

---

## 5. Database Design

### Environment Config

Simpan di `.env.local` (tidak di-commit ke git):

```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
```

> `SUPABASE_SERVICE_ROLE_KEY` hanya digunakan di server-side (tidak expose ke client). Ambil dari Supabase dashboard → Project Settings → API.

---

### Tables

#### `profiles`
Extend tabel `auth.users` dari Supabase. Trigger otomatis saat user baru dibuat.

```sql
profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text NOT NULL,
  role        text NOT NULL DEFAULT 'siswa',  -- 'admin' | 'guru' | 'siswa'
  created_at  timestamptz DEFAULT now()
)
```

---

#### `siswa`
Data master siswa (bisa linked ke `profiles` jika siswa punya akun).

```sql
siswa (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nis          text UNIQUE NOT NULL,
  nama         text NOT NULL,
  kelas        text NOT NULL,        -- misal: 'X-A', 'XI-IPS-2'
  jenis_kelamin text,                -- 'L' | 'P'
  tahun_ajaran text NOT NULL,        -- misal: '2024/2025'
  profile_id   uuid REFERENCES profiles(id),  -- nullable (jika siswa punya akun)
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
)
```

---

#### `gejala`
Master daftar gejala/pertanyaan kuesioner.

```sql
gejala (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode        text UNIQUE NOT NULL,   -- misal: 'G001'
  deskripsi   text NOT NULL,          -- teks pertanyaan
  kategori    text,                   -- kelompok gejala (opsional)
  aktif       boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
)
```

---

#### `rules_fc`
Basis pengetahuan untuk Forward Chaining.

```sql
rules_fc (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_rule    text UNIQUE NOT NULL,     -- misal: 'R001'
  nama_rule    text NOT NULL,
  kesimpulan   text NOT NULL,            -- minat yang disimpulkan
  bobot        numeric(4,2) DEFAULT 1.0, -- bobot confidence rule
  aktif        boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
)
```

---

#### `rule_gejala` *(pivot table)*
Menghubungkan rule FC dengan gejala-gejala yang diperlukan.

```sql
rule_gejala (
  rule_id    uuid REFERENCES rules_fc(id) ON DELETE CASCADE,
  gejala_id  uuid REFERENCES gejala(id) ON DELETE CASCADE,
  PRIMARY KEY (rule_id, gejala_id)
)
```

---

#### `konsultasi`
Sesi konsultasi per siswa.

```sql
konsultasi (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  siswa_id    uuid NOT NULL REFERENCES siswa(id) ON DELETE CASCADE,
  created_by  uuid REFERENCES profiles(id),   -- guru/admin yang input
  status      text DEFAULT 'pending',          -- 'pending' | 'selesai'
  catatan     text,
  created_at  timestamptz DEFAULT now()
)
```

---

#### `konsultasi_gejala` *(pivot table)*
Gejala yang dipilih dalam satu sesi konsultasi.

```sql
konsultasi_gejala (
  konsultasi_id  uuid REFERENCES konsultasi(id) ON DELETE CASCADE,
  gejala_id      uuid REFERENCES gejala(id),
  PRIMARY KEY (konsultasi_id, gejala_id)
)
```

---

#### `hasil_diagnosa`
Hasil inference dari kedua metode.

```sql
hasil_diagnosa (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  konsultasi_id     uuid UNIQUE NOT NULL REFERENCES konsultasi(id) ON DELETE CASCADE,

  -- Forward Chaining result
  fc_kesimpulan     text,
  fc_confidence     numeric(5,2),         -- 0-100
  fc_rules_matched  jsonb,                -- array rule_id yang match

  -- ID3 result
  id3_kesimpulan    text,
  id3_confidence    numeric(5,2),
  id3_path          jsonb,                -- decision path dari tree

  -- Comparison
  agreement         boolean,              -- apakah FC == ID3
  final_kesimpulan  text,                 -- rekomendasi akhir sistem

  created_at        timestamptz DEFAULT now()
)
```

---

#### `dataset_id3`
Dataset training untuk ID3. Diisi manual oleh admin atau dari import CSV.

```sql
dataset_id3 (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text NOT NULL,       -- kelas/minat yang benar
  fitur         jsonb NOT NULL,      -- {gejala_id: true/false, ...}
  tahun_ajaran  text,
  created_at    timestamptz DEFAULT now()
)
```

---

#### `comparison_results`
Agregat perbandingan akurasi (untuk halaman admin/laporan).

```sql
comparison_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periode         text NOT NULL,        -- misal: 'semester_1_2024'
  total_konsultasi int DEFAULT 0,
  fc_akurasi      numeric(5,2),
  id3_akurasi     numeric(5,2),
  agreement_rate  numeric(5,2),
  computed_at     timestamptz DEFAULT now()
)
```

---

### Entity Relationship (Ringkas)

```
auth.users
    │ (1:1)
    ▼
profiles ──────────────────── (1:N) ──► konsultasi.created_by
    │ (1:1 nullable)
    ▼
siswa ─────────────────────── (1:N) ──► konsultasi
                                              │ (1:1)
                                              ▼
gejala ◄─── rule_gejala ─── rules_fc    konsultasi_gejala ──► gejala
                                              │ (1:1)
                                              ▼
                                        hasil_diagnosa

dataset_id3 (standalone training data)
comparison_results (agregat, standalone)
```

---

### Row Level Security (RLS) Policy — Ringkas

| Table | Policy |
|---|---|
| `profiles` | User hanya bisa read/update profil sendiri; admin bisa semua |
| `siswa` | `guru` dan `admin` bisa CRUD; `siswa` hanya bisa baca data sendiri |
| `gejala` | Semua authenticated bisa read; hanya `admin` yang bisa write |
| `rules_fc` | Semua authenticated bisa read; hanya `admin` yang bisa write |
| `konsultasi` | `siswa` hanya bisa lihat konsultasi sendiri; `guru`/`admin` lihat semua |
| `hasil_diagnosa` | Sama dengan konsultasi |
| `dataset_id3` | Hanya `admin` bisa CRUD |

---

## 6. Engine Design

### 6.1 Forward Chaining

**Konsep:** Mulai dari fakta (gejala yang dipilih siswa), cocokkan dengan IF bagian dari setiap rule. Jika semua gejala dalam satu rule terpenuhi, rule tersebut "fired" dan kesimpulannya ditambahkan ke working memory.

**Step-by-step:**

```
1. INPUT
   - gejalaTerpilih: string[] (array gejala_id)

2. LOAD RULES
   - Query semua rules_fc WHERE aktif = true
   - Sertakan JOIN ke rule_gejala untuk dapat array gejala per rule

3. MATCH PHASE
   Untuk setiap rule:
   - ambil array gejala yang dibutuhkan rule (required_gejala)
   - cek apakah SEMUA required_gejala ada di gejalaTerpilih
   - jika ya → rule "fired", tambahkan ke matchedRules[]

4. CALCULATE CONFIDENCE
   - Hitung: (jumlah gejala match / total gejala di rule) × bobot rule
   - Agregasi per kesimpulan: sum confidence per kategori minat
   - Normalize ke 0-100

5. RANKING
   - Sort kesimpulan berdasarkan confidence tertinggi
   - Ambil kesimpulan dengan confidence tertinggi sebagai FC result

6. OUTPUT
   {
     kesimpulan: string,
     confidence: number,          // 0-100
     rules_matched: RuleMatch[],  // [{rule_id, kesimpulan, confidence}]
     all_scores: Record<string, number>  // semua kategori dengan skornya
   }
```

**File:** `src/lib/engine/fc.ts`

```ts
// Pseudocode struktur
interface FCInput {
  gejalaTerpilih: string[]      // array of gejala UUIDs
  rules: RuleWithGejala[]       // dari DB
}

interface FCOutput {
  kesimpulan: string
  confidence: number
  rules_matched: { rule_id: string; kesimpulan: string; confidence: number }[]
  all_scores: Record<string, number>
}

function runForwardChaining(input: FCInput): FCOutput { ... }
```

---

### 6.2 ID3 Decision Tree

**Konsep:** Bangun pohon keputusan dari dataset historis menggunakan algoritma ID3 (Information Gain). Setelah pohon dibangun, traverse tree menggunakan fitur dari input siswa untuk prediksi.

**Step-by-step:**

```
FASE 1 — BUILD TREE (dilakukan saat dataset diupdate / on-demand)

1. Load semua dataset_id3 dari DB
2. Format ke matrix fitur:
   - Setiap row = satu data historis
   - Kolom = gejala_id (boolean: ada/tidak)
   - Label kolom = minat yang benar
3. Hitung Entropy total dataset:
   Entropy(S) = -Σ (p_i × log2(p_i))
4. Untuk setiap atribut (gejala):
   - Hitung Information Gain:
     Gain(S, A) = Entropy(S) - Σ (|S_v|/|S| × Entropy(S_v))
5. Pilih atribut dengan Gain tertinggi sebagai root
6. Split dataset berdasarkan nilai atribut (true/false)
7. Rekursif untuk setiap subset sampai:
   - Semua label sama (leaf node)
   - Tidak ada atribut tersisa
   - Dataset kosong

FASE 2 — PREDICT (dilakukan setiap konsultasi)

1. Mulai dari root node tree
2. Cek nilai atribut dari input:
   - Jika gejala_X = true → pergi ke cabang true
   - Jika gejala_X = false → pergi ke cabang false
3. Terus sampai leaf node
4. Leaf node = prediksi minat

CONFIDENCE CALCULATION
- Hitung distribusi label di leaf node: P(label) = count(label) / total di node
- Confidence = probabilitas label prediksi
```

**File:** `src/lib/engine/id3.ts`

```ts
// Pseudocode struktur
interface TreeNode {
  attribute?: string    // gejala_id yang diuji
  value?: boolean       // nilai atribut di edge ke parent
  label?: string        // jika leaf node: kesimpulan
  confidence?: number   // jika leaf node: confidence
  children?: TreeNode[] // left (false), right (true)
}

function buildTree(dataset: DataPoint[]): TreeNode { ... }
function predict(tree: TreeNode, input: Record<string, boolean>): ID3Output { ... }
function calculateEntropy(labels: string[]): number { ... }
function calculateGain(dataset: DataPoint[], attribute: string): number { ... }
```

---

### 6.3 Comparison Engine

**File:** `src/lib/engine/comparison.ts`

```ts
interface ComparisonInput {
  fc: FCOutput
  id3: ID3Output
}

interface ComparisonOutput {
  agreement: boolean
  final_kesimpulan: string  // ambil dari FC jika setuju, atau yang confidence-nya lebih tinggi
  confidence_diff: number
  recommendation_note: string
}

// Logic:
// - Jika FC.kesimpulan === ID3.kesimpulan → agreement: true, final = salah satu
// - Jika berbeda → ambil yang confidence lebih tinggi, flag sebagai perlu review
// - Beri note: "Kedua metode sepakat" / "Perlu verifikasi guru BK"
```

---

### 6.4 Where Logic Lives

```
server-side ONLY:
  src/lib/engine/fc.ts
  src/lib/engine/id3.ts
  src/lib/engine/comparison.ts

Called from:
  src/app/api/konsultasi/run-inference/route.ts  (POST handler)
  src/app/actions/inference.ts                   (Server Action)

NEVER imported in client components.
```

---

## 7. API Design

### Supabase Query Patterns

**Server Component (read):**
```ts
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (n) => cookieStore.get(n)?.value, ... } }
  )
}
```

**Service Role (admin operations, bypas RLS):**
```ts
// src/lib/supabase/service.ts — HANYA untuk server-side
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const serviceClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

---

### Route Handlers

```
POST   /api/konsultasi/run-inference
       Body: { siswa_id, konsultasi_id, gejala_ids[] }
       Response: { fc_result, id3_result, comparison }

GET    /api/laporan/export
       Query: { kelas?, periode?, format: 'csv' | 'pdf' }
       Response: file download

POST   /api/admin/dataset/import
       Body: FormData (CSV file)
       Response: { imported_count, errors[] }

GET    /api/admin/id3/tree
       Response: { tree: TreeNode, accuracy: number, dataset_count: number }
```

---

### Server Actions (untuk form mutations)

```
src/app/actions/
  auth.ts        — login, logout
  siswa.ts       — createSiswa, updateSiswa, deleteSiswa
  konsultasi.ts  — createKonsultasi, submitGejala
  inference.ts   — runInference (memanggil engine)
  rules.ts       — createRule, updateRule, toggleRule
  dataset.ts     — addDataPoint, importDataset
```

---

### Auth Flow Detail

```
1. User submit form login di /login
2. Client call Server Action: loginAction({ email, password })
3. Server Action: supabase.auth.signInWithPassword(...)
4. Supabase return session → set ke cookies via response
5. Server Action redirect ke /dashboard
6. Middleware (middleware.ts):
   - Jalankan di setiap request ke protected routes
   - Baca session dari cookies
   - Query profiles untuk cek role
   - Set header x-user-role untuk digunakan di Server Components
7. Server Component baca role dari header, render konten sesuai role
```

---

## 8. Project Structure

```
sanu/
├── .env.local                          # env vars (tidak di-commit)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── layout.tsx                  # root layout (font, theme provider)
│   │   ├── page.tsx                    # landing / redirect ke /dashboard
│   │   ├── globals.css
│   │   │
│   │   ├── (auth)/                     # route group tanpa sidebar
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (app)/                      # route group dengan sidebar layout
│   │   │   ├── layout.tsx              # sidebar + topbar layout
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── siswa/
│   │   │   │   ├── page.tsx            # list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # detail
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── konsultasi/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx        # kuesioner flow
│   │   │   │   └── [id]/
│   │   │   │       └── hasil/
│   │   │   │           └── page.tsx    # hasil + comparison
│   │   │   │
│   │   │   ├── laporan/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── admin/                  # admin-only routes
│   │   │       ├── rules/
│   │   │       │   └── page.tsx
│   │   │       ├── gejala/
│   │   │       │   └── page.tsx
│   │   │       ├── dataset/
│   │   │       │   └── page.tsx
│   │   │       └── comparison/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                        # Route Handlers
│   │       ├── konsultasi/
│   │       │   └── run-inference/
│   │       │       └── route.ts
│   │       ├── laporan/
│   │       │   └── export/
│   │       │       └── route.ts
│   │       └── admin/
│   │           ├── dataset/
│   │           │   └── import/
│   │           │       └── route.ts
│   │           └── id3/
│   │               └── tree/
│   │                   └── route.ts
│   │
│   ├── actions/                        # Server Actions
│   │   ├── auth.ts
│   │   ├── siswa.ts
│   │   ├── konsultasi.ts
│   │   ├── inference.ts
│   │   ├── rules.ts
│   │   └── dataset.ts
│   │
│   ├── components/                     # UI Components
│   │   ├── ui/                         # Shadcn UI components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/                     # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   ├── BottomNav.tsx           # mobile only
│   │   │   └── PageHeader.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── RecentConsultations.tsx
│   │   │   └── DistribusiMinatChart.tsx
│   │   │
│   │   ├── siswa/
│   │   │   ├── SiswaTable.tsx
│   │   │   ├── SiswaForm.tsx
│   │   │   └── SiswaCard.tsx           # mobile view
│   │   │
│   │   ├── konsultasi/
│   │   │   ├── QuestionStep.tsx
│   │   │   ├── StepIndicator.tsx
│   │   │   └── ProgressBar.tsx
│   │   │
│   │   ├── hasil/
│   │   │   ├── ResultHero.tsx
│   │   │   ├── ConfidenceBar.tsx
│   │   │   ├── FCResultCard.tsx
│   │   │   ├── ID3ResultCard.tsx
│   │   │   └── ComparisonTable.tsx
│   │   │
│   │   └── admin/
│   │       ├── RuleEditor.tsx
│   │       ├── RuleTable.tsx
│   │       └── DatasetImporter.tsx
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts               # browser client
│   │   │   ├── server.ts               # server client (dengan cookies)
│   │   │   └── service.ts              # service role client (admin ops)
│   │   │
│   │   ├── engine/                     # INFERENCE ENGINE — server only
│   │   │   ├── fc.ts                   # Forward Chaining
│   │   │   ├── id3.ts                  # ID3 Decision Tree
│   │   │   ├── comparison.ts           # Comparison logic
│   │   │   └── types.ts                # Engine type definitions
│   │   │
│   │   └── utils/
│   │       ├── format.ts               # date, number formatting
│   │       ├── cn.ts                   # className merger (clsx + twMerge)
│   │       └── export.ts               # CSV/PDF export helpers
│   │
│   ├── hooks/                          # Custom React Hooks
│   │   ├── useUser.ts
│   │   └── useMediaQuery.ts
│   │
│   └── types/
│       ├── database.ts                 # Generated Supabase types
│       ├── engine.ts                   # Engine input/output types
│       └── index.ts                    # Re-exports
│
└── middleware.ts                       # Auth + role guard
```

---

## 9. Development Phases

### Phase 1 — Project Setup (1–2 hari)

- [ ] Init Next.js 14 dengan TypeScript: `npx create-next-app@latest sanu --typescript --tailwind --app`
- [ ] Setup Shadcn UI: `npx shadcn@latest init`
- [ ] Install dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `clsx`, `tailwind-merge`, `lucide-react`
- [ ] Setup `.env.local` dengan Supabase credentials
- [ ] Setup `tailwind.config.ts` dengan custom color palette
- [ ] Setup `middleware.ts` untuk auth guard (skeleton dulu)
- [ ] Setup folder structure sesuai di atas
- [ ] Push ke GitHub, hubungkan ke Vercel (CI/CD otomatis)

**Deliverable:** Repo bersih, bisa deploy ke Vercel dengan halaman kosong

---

### Phase 2 — Supabase Setup (2–3 hari)

- [ ] Buat semua tabel di Supabase SQL Editor sesuai schema
- [ ] Enable RLS di semua tabel
- [ ] Tulis policy RLS per tabel
- [ ] Buat trigger untuk auto-insert ke `profiles` saat user baru
- [ ] Generate TypeScript types: `npx supabase gen types typescript`
- [ ] Seed data: tambah minimal 5 gejala, 3 rules FC, 10 dataset ID3
- [ ] Test koneksi dari Next.js (ping query sederhana)

**Deliverable:** Database ready, types ter-generate, koneksi verified

---

### Phase 3 — CRUD Modules (3–5 hari)

- [ ] Auth: login page, server action, middleware lengkap
- [ ] Layout: Sidebar, Topbar, BottomNav (mobile)
- [ ] Siswa: list, add, edit, delete, detail page
- [ ] Gejala: admin CRUD
- [ ] Rules FC: admin CRUD dengan toggle aktif/nonaktif
- [ ] Dataset ID3: admin add/import/delete

**Deliverable:** Semua CRUD berfungsi, UI sesuai design system

---

### Phase 4 — Inference Engine (3–4 hari)

- [ ] Implementasi `fc.ts` dengan unit test manual
- [ ] Implementasi `id3.ts` — build tree + predict
- [ ] Implementasi `comparison.ts`
- [ ] Buat Server Action `runInference`
- [ ] Buat Route Handler `/api/konsultasi/run-inference`
- [ ] Test dengan data dummy: pastikan output logis

**Deliverable:** Engine berjalan dengan benar, output tersimpan ke DB

---

### Phase 5 — UI Dashboard & Kuesioner (3–4 hari)

- [ ] Dashboard: stat cards, chart distribusi, recent activity
- [ ] Kuesioner: multi-step form, progress indicator
- [ ] Halaman hasil: hero, confidence bars, comparison table, FC vs ID3 cards
- [ ] Admin: rule manager split view, dataset viewer, tree visualizer sederhana
- [ ] Laporan: tabel rekap, filter kelas/periode

**Deliverable:** Semua UI selesai, end-to-end flow kuesioner → hasil berfungsi

---

### Phase 6 — Testing & Polish (2–3 hari)

- [ ] Test semua role (admin, guru, siswa) di browser berbeda
- [ ] Test edge cases engine: gejala kosong, tidak ada rule match, dataset kurang
- [ ] Responsive test di mobile (Chrome DevTools + device nyata)
- [ ] Fix bug UI yang ditemukan
- [ ] Optimize query Supabase (tambah index jika perlu)
- [ ] Review RLS policy — pastikan tidak ada data leak antar user

**Deliverable:** Aplikasi stabil, tidak ada bug kritis

---

### Phase 7 — Deployment (1 hari)

- [ ] Set environment variables di Vercel dashboard
- [ ] Test production build: `npm run build` lokal dulu
- [ ] Deploy ke Vercel via GitHub push
- [ ] Verifikasi semua fitur di production URL
- [ ] Setup custom domain (opsional)

**Deliverable:** Aplikasi live di production URL

---

## 10. MVP Definition

Fitur **minimum** yang wajib ada untuk skripsi (tidak boleh dikurangi):

### ✅ Must Have

| # | Fitur | Keterangan |
|---|---|---|
| 1 | **Login / Logout** | Email + password via Supabase Auth |
| 2 | **Role: Admin, Guru, Siswa** | Akses berbeda per role |
| 3 | **CRUD Siswa** | Admin/guru bisa kelola data siswa |
| 4 | **CRUD Gejala** | Admin bisa kelola pertanyaan kuesioner |
| 5 | **CRUD Rules FC** | Admin bisa kelola knowledge base |
| 6 | **Kuesioner** | Siswa isi form, pilih gejala |
| 7 | **FC Inference** | Engine FC jalan, simpan hasil |
| 8 | **ID3 Inference** | Engine ID3 jalan dari dataset |
| 9 | **Hasil Konsultasi** | Tampil hasil + confidence |
| 10 | **Comparison FC vs ID3** | Tampil perbedaan/persamaan kedua metode |
| 11 | **Riwayat Konsultasi** | Guru/admin bisa lihat semua histori |
| 12 | **Dashboard Overview** | Stat dan grafik ringkas |

### ⬜ Nice to Have (jika waktu memungkinkan)

| # | Fitur |
|---|---|
| 1 | Export laporan ke CSV |
| 2 | Export hasil ke PDF |
| 3 | Visualisasi pohon keputusan ID3 (interaktif) |
| 4 | Import dataset dari CSV |
| 5 | Notifikasi in-app (toast untuk guru saat ada konsultasi baru) |
| 6 | Dark mode toggle |
| 7 | Akun siswa bisa login dan isi kuesioner sendiri |

---

## 11. Execution Roadmap

Bagian ini adalah urutan kerja praktis saat mulai coding. Fokusnya bukan teori, tapi langkah eksekusi supaya development tidak loncat-loncat dan setiap milestone punya output yang bisa dites.

---

### 11.1 Prinsip Eksekusi

1. **Bangun fondasi dulu, baru fitur.** Jangan mulai dari dashboard cantik sebelum auth, database, dan schema stabil.
2. **Engine harus bisa dites tanpa UI.** Forward Chaining dan ID3 dibuat sebagai pure server-side logic agar mudah diverifikasi.
3. **CRUD selesai sebelum inference.** Kuesioner dan engine butuh data `siswa`, `gejala`, `rules_fc`, dan `dataset_id3` yang valid.
4. **UI dibuat setelah flow data jelas.** Komponen visual mengikuti data nyata, bukan dummy layout terlalu lama.
5. **Setiap phase harus punya demo kecil.** Jangan tunggu semua selesai baru dites.

---

### 11.2 Priority Order

Urutan prioritas kerja:

| Priority | Area | Kenapa Duluan |
|---|---|---|
| P0 | Project setup + env + Supabase client | Semua fitur bergantung ke koneksi Supabase |
| P0 | Database schema + RLS dasar | Struktur data harus stabil sebelum UI |
| P0 | Auth + protected layout | Aplikasi dashboard wajib punya login |
| P1 | CRUD siswa, gejala, rules FC | Data master untuk menjalankan konsultasi |
| P1 | Forward Chaining engine | Core skripsi, paling mudah divalidasi dulu |
| P1 | Kuesioner + hasil FC | End-to-end flow pertama |
| P2 | Dataset ID3 + engine ID3 | Core pembanding metode |
| P2 | Comparison dashboard | Bukti analisis FC vs ID3 |
| P3 | Laporan + export | Pendukung skripsi dan presentasi |
| P3 | Polish responsive + deployment | Finalisasi production-ready |

---

### 11.3 Sprint Plan

Total estimasi realistis: **14-21 hari kerja**, tergantung kelengkapan data rule dan dataset.

#### Sprint 0 — Preparation

**Goal:** Semua keputusan teknis sudah locked sebelum coding.

Checklist:
- [ ] Finalisasi daftar role: `admin`, `guru`, `siswa`
- [ ] Finalisasi kategori minat yang akan dipakai
- [ ] Finalisasi daftar gejala awal minimal 20-30 item
- [ ] Finalisasi rule Forward Chaining minimal 10-15 rule
- [ ] Siapkan dataset ID3 minimal 30-50 row awal
- [ ] Pastikan Supabase project aktif
- [ ] Simpan env di `.env.local`

Output:
- Dataset awal siap input
- Tidak ada perubahan besar pada scope MVP

---

#### Sprint 1 — Foundation

**Goal:** Project bisa jalan lokal, terhubung Supabase, dan layout dasar siap.

Task:
- [ ] Init Next.js 14 App Router + TypeScript + Tailwind
- [ ] Install Supabase packages
- [ ] Setup Shadcn UI
- [ ] Setup `tailwind.config.ts` sesuai design system
- [ ] Setup `src/lib/supabase/client.ts`
- [ ] Setup `src/lib/supabase/server.ts`
- [ ] Setup root layout, font Inter, global CSS
- [ ] Buat route group `(auth)` dan `(app)`
- [ ] Buat skeleton layout dashboard: sidebar, topbar, content area

Definition of Done:
- `npm run dev` jalan tanpa error
- Halaman `/login` dan `/dashboard` bisa dibuka
- Supabase query test berhasil dari server component

---

#### Sprint 2 — Database & Auth

**Goal:** Auth dan access control berjalan.

Task:
- [ ] Buat semua tabel utama di Supabase
- [ ] Enable RLS
- [ ] Tambah policy dasar per role
- [ ] Buat trigger auto-create `profiles`
- [ ] Buat login page
- [ ] Buat `loginAction`
- [ ] Buat `logoutAction`
- [ ] Buat middleware route protection
- [ ] Buat halaman `/unauthorized`
- [ ] Seed user admin pertama

Definition of Done:
- User bisa login dan logout
- Route dashboard tidak bisa diakses tanpa session
- Admin/guru/siswa bisa diarahkan ke halaman yang sesuai

---

#### Sprint 3 — Data Master CRUD

**Goal:** Admin/guru bisa mengelola data dasar untuk konsultasi.

Task:
- [ ] CRUD `siswa`
- [ ] CRUD `gejala`
- [ ] CRUD `rules_fc`
- [ ] Buat pivot assignment `rule_gejala`
- [ ] Buat table dense untuk list data
- [ ] Buat search/filter dasar
- [ ] Tambah empty state yang profesional
- [ ] Tambah confirmation dialog untuk delete

Definition of Done:
- Siswa bisa ditambah, diedit, dihapus
- Gejala bisa diaktifkan/nonaktifkan
- Rule FC bisa dibuat dengan banyak gejala
- Semua list usable di desktop dan mobile

---

#### Sprint 4 — Forward Chaining End-to-End

**Goal:** Flow konsultasi pertama selesai dari input gejala sampai hasil FC.

Task:
- [ ] Buat `src/lib/engine/types.ts`
- [ ] Buat `src/lib/engine/fc.ts`
- [ ] Buat helper query untuk load rules + gejala
- [ ] Buat halaman `/konsultasi/new`
- [ ] Buat multi-step questionnaire UI
- [ ] Buat `createKonsultasi` server action
- [ ] Simpan selected gejala ke `konsultasi_gejala`
- [ ] Jalankan FC engine server-side
- [ ] Simpan hasil awal ke `hasil_diagnosa`
- [ ] Buat halaman hasil dengan FC card

Definition of Done:
- Siswa/guru bisa memilih gejala
- Sistem menghasilkan kesimpulan FC
- Matched rules dan confidence tersimpan di database
- Hasil bisa dibuka ulang lewat URL konsultasi

---

#### Sprint 5 — ID3 Engine

**Goal:** ID3 bisa membaca dataset, membangun tree, dan memberi prediksi.

Task:
- [ ] Buat CRUD/import manual `dataset_id3`
- [ ] Buat `src/lib/engine/id3.ts`
- [ ] Implement entropy calculation
- [ ] Implement information gain
- [ ] Implement recursive tree builder
- [ ] Implement prediction traversal
- [ ] Simpan `id3_kesimpulan`, `id3_confidence`, dan `id3_path`
- [ ] Tambah panel hasil ID3 di halaman hasil

Definition of Done:
- Dataset ID3 bisa dikelola admin
- Engine ID3 menghasilkan prediksi dari input gejala
- Path keputusan bisa ditampilkan ringkas di UI

---

#### Sprint 6 — Comparison & Dashboard

**Goal:** Aplikasi menunjukkan perbandingan metode secara jelas.

Task:
- [ ] Buat `src/lib/engine/comparison.ts`
- [ ] Hitung `agreement`
- [ ] Tentukan `final_kesimpulan`
- [ ] Tambah comparison section di halaman hasil
- [ ] Buat dashboard stat cards
- [ ] Buat chart distribusi minat
- [ ] Buat tabel konsultasi terbaru
- [ ] Buat halaman `/admin/comparison`

Definition of Done:
- FC dan ID3 tampil berdampingan
- Jika hasil berbeda, sistem memberi note perlu review guru
- Dashboard menampilkan angka real dari database

---

#### Sprint 7 — Report, Responsive, Deployment

**Goal:** Aplikasi siap demo dan siap deploy.

Task:
- [ ] Buat halaman `/laporan`
- [ ] Tambah filter kelas dan periode
- [ ] Tambah export CSV jika waktu cukup
- [ ] Mobile QA untuk semua halaman utama
- [ ] Table-to-card behavior di mobile
- [ ] Test RLS dengan akun berbeda
- [ ] Run production build
- [ ] Setup env di Vercel
- [ ] Deploy ke Vercel
- [ ] Smoke test production URL

Definition of Done:
- Flow utama bisa didemokan dari login sampai hasil
- Data siswa tidak bocor antar role
- Production URL berjalan tanpa error build

---

### 11.4 Daily Execution Checklist

Gunakan checklist ini setiap mulai sesi coding:

1. Cek branch dan working tree.
2. Pilih satu task kecil dari sprint aktif.
3. Baca file terkait sebelum edit.
4. Implement hanya scope task tersebut.
5. Jalankan minimal validasi lokal yang relevan.
6. Cek responsive jika menyentuh UI.
7. Catat task selesai dan blocker.

Gunakan checklist ini sebelum mengakhiri sesi coding:

1. Pastikan app masih bisa jalan.
2. Pastikan tidak ada linter/type error baru.
3. Pastikan data Supabase tidak rusak karena test manual.
4. Update checklist sprint.
5. Commit jika milestone sudah stabil.

---

### 11.5 Build Order Per Folder

Urutan pembuatan folder/file yang disarankan:

```text
1. src/lib/supabase/*
2. src/app/layout.tsx
3. src/app/(auth)/login/page.tsx
4. middleware.ts
5. src/app/(app)/layout.tsx
6. src/components/layout/*
7. src/actions/auth.ts
8. src/actions/siswa.ts
9. src/app/(app)/siswa/*
10. src/actions/rules.ts
11. src/app/(app)/admin/gejala/*
12. src/app/(app)/admin/rules/*
13. src/lib/engine/types.ts
14. src/lib/engine/fc.ts
15. src/app/(app)/konsultasi/new/page.tsx
16. src/app/(app)/konsultasi/[id]/hasil/page.tsx
17. src/lib/engine/id3.ts
18. src/lib/engine/comparison.ts
19. src/app/(app)/dashboard/page.tsx
20. src/app/(app)/laporan/page.tsx
```

---

### 11.6 Testing Strategy

Testing tidak perlu terlalu berat di awal, tapi setiap core flow harus bisa diverifikasi.

| Area | Cara Test |
|---|---|
| Auth | Login/logout dengan 3 role |
| RLS | Coba akses data siswa dari akun siswa lain |
| CRUD | Create/update/delete data dari UI dan cek DB |
| FC Engine | Input gejala tertentu harus menghasilkan rule yang diprediksi |
| ID3 Engine | Dataset kecil dengan label jelas harus menghasilkan tree logis |
| Comparison | Kasus FC == ID3 dan FC != ID3 harus tampil benar |
| Responsive | Test 375px, 768px, 1024px |
| Deployment | `npm run build`, deploy, smoke test production |

---

### 11.7 Risk & Mitigation

| Risk | Dampak | Mitigasi |
|---|---|---|
| Dataset ID3 terlalu sedikit | Prediksi tidak stabil | Mulai dengan dataset kecil tapi seimbang per label |
| Rule FC ambigu | Banyak kesimpulan confidence mirip | Tambahkan bobot dan tampilkan perlu review guru |
| RLS salah | Data siswa bisa bocor | Test manual dengan beberapa akun role |
| UI terlalu longgar | Terlihat seperti template demo | Ikuti dense dashboard rules dari section UI/UX |
| Engine masuk client bundle | Logic exposed dan app berat | Semua engine hanya dipanggil dari server action/route handler |
| Scope melebar | MVP tidak selesai | Nice-to-have hanya dikerjakan setelah must-have selesai |

---

### 11.8 First Coding Task Setelah Dokumen Ini

Task pertama yang paling aman untuk dimulai:

```text
Initialize Next.js 14 project with TypeScript, Tailwind, App Router,
then configure Supabase environment and base folder structure.
```

Acceptance criteria:
- Project Next.js berhasil dibuat
- Tailwind aktif
- Shadcn UI siap
- `.env.local` tersedia lokal
- `src/lib/supabase/client.ts` dan `server.ts` tersedia
- `/login` dan `/dashboard` skeleton bisa dibuka

---

## Appendix — Dependencies

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "@supabase/ssr": "latest",
    "@supabase/supabase-js": "latest",
    "tailwindcss": "3.x",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "latest",
    "recharts": "latest",
    "react-hook-form": "latest",
    "zod": "latest",
    "@hookform/resolvers": "latest"
  }
}
```

Shadcn UI components yang akan dipakai:
`Button`, `Input`, `Select`, `Textarea`, `Table`, `Badge`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Progress`, `Separator`, `Avatar`, `DropdownMenu`, `Tooltip`

---

*Dokumen ini adalah blueprint eksekusi. Setiap phase dapat dimulai setelah phase sebelumnya selesai. Engine code tidak boleh ada di client bundle. Semua env vars sensitif tidak boleh di-commit ke git.*
