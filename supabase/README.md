# Supabase Setup

Jalankan file SQL dengan urutan berikut:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/seed/001_initial_seed.sql`

Cara paling cepat:

1. Buka Supabase Dashboard.
2. Masuk ke project `ickfwovdyhrcnixvcpyr`.
3. Buka **SQL Editor**.
4. Paste isi migration, jalankan sampai sukses.
5. Paste isi seed, jalankan sampai sukses.
6. Buat user pertama lewat **Authentication > Users**.
7. Update role user pertama menjadi admin:

```sql
update public.profiles
set role = 'admin', full_name = 'Admin Sekolah'
where id = '<USER_UUID_DARI_AUTH_USERS>';
```

Catatan:
- `SUPABASE_SERVICE_ROLE_KEY` hanya dipakai server-side.
- Jangan expose service role key ke browser.
- Setelah schema stabil, tipe `src/types/database.ts` bisa diganti dengan hasil generate resmi dari Supabase CLI.
