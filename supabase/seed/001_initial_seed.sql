-- Sistem Pakar Analisis Minat Belajar initial seed data
-- Run after supabase/migrations/001_initial_schema.sql.

insert into public.gejala (kode, deskripsi, kategori, aktif)
values
  ('G001', 'Siswa menyukai pelajaran matematika dan pemecahan masalah numerik.', 'akademik', true),
  ('G002', 'Siswa tertarik melakukan eksperimen atau praktikum sains.', 'akademik', true),
  ('G003', 'Siswa senang membaca artikel ilmiah atau pengetahuan alam.', 'akademik', true),
  ('G004', 'Siswa teliti saat mengamati data, grafik, atau pola.', 'kognitif', true),
  ('G005', 'Siswa tertarik membahas isu sosial, ekonomi, atau masyarakat.', 'sosial', true),
  ('G006', 'Siswa mudah memahami pelajaran sejarah dan geografi.', 'akademik', true),
  ('G007', 'Siswa senang berdiskusi dan menyampaikan pendapat.', 'komunikasi', true),
  ('G008', 'Siswa tertarik memahami perilaku manusia dan lingkungan sosial.', 'sosial', true),
  ('G009', 'Siswa menyukai membaca novel, cerita, atau teks panjang.', 'bahasa', true),
  ('G010', 'Siswa senang menulis cerita, esai, puisi, atau opini.', 'bahasa', true),
  ('G011', 'Siswa mudah mempelajari bahasa asing atau kosakata baru.', 'bahasa', true),
  ('G012', 'Siswa percaya diri saat presentasi atau berbicara di depan umum.', 'komunikasi', true),
  ('G013', 'Siswa tertarik dengan komputer, aplikasi, atau teknologi digital.', 'teknologi', true),
  ('G014', 'Siswa senang mencoba membuat program, website, atau otomasi sederhana.', 'teknologi', true),
  ('G015', 'Siswa cepat memahami pola logika dan alur instruksi.', 'teknologi', true),
  ('G016', 'Siswa sering mencari solusi teknis saat perangkat atau aplikasi bermasalah.', 'teknologi', true),
  ('G017', 'Siswa menyukai menggambar, desain, musik, tari, atau aktivitas kreatif.', 'seni', true),
  ('G018', 'Siswa memiliki imajinasi kuat untuk membuat karya visual atau audio.', 'seni', true),
  ('G019', 'Siswa nyaman mengekspresikan ide melalui karya kreatif.', 'seni', true),
  ('G020', 'Siswa tertarik mengikuti lomba atau kegiatan seni.', 'seni', true),
  ('G021', 'Siswa aktif dalam kegiatan olahraga atau aktivitas fisik.', 'olahraga', true),
  ('G022', 'Siswa memiliki koordinasi gerak dan daya tahan tubuh yang baik.', 'olahraga', true),
  ('G023', 'Siswa senang bekerja dalam tim saat aktivitas fisik.', 'olahraga', true),
  ('G024', 'Siswa tertarik mengikuti kompetisi olahraga.', 'olahraga', true)
on conflict (kode) do update
set
  deskripsi = excluded.deskripsi,
  kategori = excluded.kategori,
  aktif = excluded.aktif;

insert into public.rules_fc (kode_rule, nama_rule, kesimpulan, bobot, aktif)
values
  ('R001', 'Minat IPA dari kemampuan sains dan numerik', 'IPA', 1.00, true),
  ('R002', 'Minat IPA dari observasi dan eksperimen', 'IPA', 0.90, true),
  ('R003', 'Minat IPS dari sosial dan diskusi', 'IPS', 1.00, true),
  ('R004', 'Minat IPS dari pemahaman masyarakat', 'IPS', 0.90, true),
  ('R005', 'Minat Bahasa dari membaca dan menulis', 'Bahasa', 1.00, true),
  ('R006', 'Minat Bahasa dari komunikasi dan bahasa asing', 'Bahasa', 0.95, true),
  ('R007', 'Minat Teknologi dari komputer dan logika', 'Teknologi', 1.00, true),
  ('R008', 'Minat Teknologi dari pemrograman dan problem solving teknis', 'Teknologi', 0.95, true),
  ('R009', 'Minat Seni dari ekspresi dan kreativitas', 'Seni', 1.00, true),
  ('R010', 'Minat Seni dari karya dan kegiatan seni', 'Seni', 0.90, true),
  ('R011', 'Minat Olahraga dari fisik dan tim', 'Olahraga', 1.00, true),
  ('R012', 'Minat Olahraga dari kompetisi dan daya tahan', 'Olahraga', 0.90, true)
on conflict (kode_rule) do update
set
  nama_rule = excluded.nama_rule,
  kesimpulan = excluded.kesimpulan,
  bobot = excluded.bobot,
  aktif = excluded.aktif;

with pairs (kode_rule, kode_gejala) as (
  values
    ('R001', 'G001'), ('R001', 'G002'), ('R001', 'G004'),
    ('R002', 'G002'), ('R002', 'G003'), ('R002', 'G004'),
    ('R003', 'G005'), ('R003', 'G007'), ('R003', 'G008'),
    ('R004', 'G005'), ('R004', 'G006'), ('R004', 'G008'),
    ('R005', 'G009'), ('R005', 'G010'), ('R005', 'G011'),
    ('R006', 'G010'), ('R006', 'G011'), ('R006', 'G012'),
    ('R007', 'G013'), ('R007', 'G014'), ('R007', 'G015'),
    ('R008', 'G014'), ('R008', 'G015'), ('R008', 'G016'),
    ('R009', 'G017'), ('R009', 'G018'), ('R009', 'G019'),
    ('R010', 'G017'), ('R010', 'G019'), ('R010', 'G020'),
    ('R011', 'G021'), ('R011', 'G022'), ('R011', 'G023'),
    ('R012', 'G021'), ('R012', 'G022'), ('R012', 'G024')
)
insert into public.rule_gejala (rule_id, gejala_id)
select r.id, g.id
from pairs p
join public.rules_fc r on r.kode_rule = p.kode_rule
join public.gejala g on g.kode = p.kode_gejala
on conflict (rule_id, gejala_id) do nothing;

with rows (label, fitur, tahun_ajaran) as (
  values
    ('IPA', '{"G001": true, "G002": true, "G003": true, "G004": true}'::jsonb, '2024/2025'),
    ('IPA', '{"G001": true, "G002": true, "G004": true, "G013": true}'::jsonb, '2024/2025'),
    ('IPA', '{"G002": true, "G003": true, "G004": true}'::jsonb, '2024/2025'),
    ('IPS', '{"G005": true, "G006": true, "G007": true, "G008": true}'::jsonb, '2024/2025'),
    ('IPS', '{"G005": true, "G007": true, "G008": true, "G012": true}'::jsonb, '2024/2025'),
    ('IPS', '{"G006": true, "G008": true, "G007": true}'::jsonb, '2024/2025'),
    ('Bahasa', '{"G009": true, "G010": true, "G011": true, "G012": true}'::jsonb, '2024/2025'),
    ('Bahasa', '{"G009": true, "G010": true, "G011": true}'::jsonb, '2024/2025'),
    ('Bahasa', '{"G010": true, "G011": true, "G012": true, "G007": true}'::jsonb, '2024/2025'),
    ('Teknologi', '{"G013": true, "G014": true, "G015": true, "G016": true}'::jsonb, '2024/2025'),
    ('Teknologi', '{"G001": true, "G013": true, "G014": true, "G015": true}'::jsonb, '2024/2025'),
    ('Teknologi', '{"G014": true, "G015": true, "G016": true, "G004": true}'::jsonb, '2024/2025'),
    ('Seni', '{"G017": true, "G018": true, "G019": true, "G020": true}'::jsonb, '2024/2025'),
    ('Seni', '{"G017": true, "G018": true, "G019": true}'::jsonb, '2024/2025'),
    ('Seni', '{"G010": true, "G017": true, "G019": true, "G020": true}'::jsonb, '2024/2025'),
    ('Olahraga', '{"G021": true, "G022": true, "G023": true, "G024": true}'::jsonb, '2024/2025'),
    ('Olahraga', '{"G021": true, "G022": true, "G023": true}'::jsonb, '2024/2025'),
    ('Olahraga', '{"G021": true, "G022": true, "G024": true, "G007": true}'::jsonb, '2024/2025')
)
insert into public.dataset_id3 (label, fitur, tahun_ajaran)
select rows.label, rows.fitur, rows.tahun_ajaran
from rows
where not exists (
  select 1
  from public.dataset_id3 d
  where d.label = rows.label
    and d.fitur = rows.fitur
);
