export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "guru" | "siswa";
export type JenisKelamin = "L" | "P";
export type KonsultasiStatus = "pending" | "selesai";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: UserRole;
          created_at?: string;
        };
        Relationships: [];
      };
      siswa: {
        Row: {
          id: string;
          nis: string;
          nama: string;
          kelas: string;
          jenis_kelamin: JenisKelamin | null;
          tahun_ajaran: string;
          profile_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nis: string;
          nama: string;
          kelas: string;
          jenis_kelamin?: JenisKelamin | null;
          tahun_ajaran: string;
          profile_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          nis?: string;
          nama?: string;
          kelas?: string;
          jenis_kelamin?: JenisKelamin | null;
          tahun_ajaran?: string;
          profile_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      gejala: {
        Row: {
          id: string;
          kode: string;
          deskripsi: string;
          kategori: string | null;
          aktif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          kode: string;
          deskripsi: string;
          kategori?: string | null;
          aktif?: boolean;
          created_at?: string;
        };
        Update: {
          kode?: string;
          deskripsi?: string;
          kategori?: string | null;
          aktif?: boolean;
        };
        Relationships: [];
      };
      rules_fc: {
        Row: {
          id: string;
          kode_rule: string;
          nama_rule: string;
          kesimpulan: string;
          bobot: number;
          aktif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          kode_rule: string;
          nama_rule: string;
          kesimpulan: string;
          bobot?: number;
          aktif?: boolean;
          created_at?: string;
        };
        Update: {
          kode_rule?: string;
          nama_rule?: string;
          kesimpulan?: string;
          bobot?: number;
          aktif?: boolean;
        };
        Relationships: [];
      };
      rule_gejala: {
        Row: {
          rule_id: string;
          gejala_id: string;
        };
        Insert: {
          rule_id: string;
          gejala_id: string;
        };
        Update: {
          rule_id?: string;
          gejala_id?: string;
        };
        Relationships: [];
      };
      konsultasi: {
        Row: {
          id: string;
          siswa_id: string;
          created_by: string | null;
          status: KonsultasiStatus;
          catatan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          siswa_id: string;
          created_by?: string | null;
          status?: KonsultasiStatus;
          catatan?: string | null;
          created_at?: string;
        };
        Update: {
          siswa_id?: string;
          created_by?: string | null;
          status?: KonsultasiStatus;
          catatan?: string | null;
        };
        Relationships: [];
      };
      konsultasi_gejala: {
        Row: {
          konsultasi_id: string;
          gejala_id: string;
        };
        Insert: {
          konsultasi_id: string;
          gejala_id: string;
        };
        Update: {
          konsultasi_id?: string;
          gejala_id?: string;
        };
        Relationships: [];
      };
      hasil_diagnosa: {
        Row: {
          id: string;
          konsultasi_id: string;
          fc_kesimpulan: string | null;
          fc_confidence: number | null;
          fc_rules_matched: Json;
          id3_kesimpulan: string | null;
          id3_confidence: number | null;
          id3_path: Json;
          agreement: boolean | null;
          final_kesimpulan: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          konsultasi_id: string;
          fc_kesimpulan?: string | null;
          fc_confidence?: number | null;
          fc_rules_matched?: Json;
          id3_kesimpulan?: string | null;
          id3_confidence?: number | null;
          id3_path?: Json;
          agreement?: boolean | null;
          final_kesimpulan?: string | null;
          created_at?: string;
        };
        Update: {
          fc_kesimpulan?: string | null;
          fc_confidence?: number | null;
          fc_rules_matched?: Json;
          id3_kesimpulan?: string | null;
          id3_confidence?: number | null;
          id3_path?: Json;
          agreement?: boolean | null;
          final_kesimpulan?: string | null;
        };
        Relationships: [];
      };
      dataset_id3: {
        Row: {
          id: string;
          label: string;
          fitur: Json;
          tahun_ajaran: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          fitur: Json;
          tahun_ajaran?: string | null;
          created_at?: string;
        };
        Update: {
          label?: string;
          fitur?: Json;
          tahun_ajaran?: string | null;
        };
        Relationships: [];
      };
      comparison_results: {
        Row: {
          id: string;
          periode: string;
          total_konsultasi: number;
          fc_akurasi: number | null;
          id3_akurasi: number | null;
          agreement_rate: number | null;
          computed_at: string;
        };
        Insert: {
          id?: string;
          periode: string;
          total_konsultasi?: number;
          fc_akurasi?: number | null;
          id3_akurasi?: number | null;
          agreement_rate?: number | null;
          computed_at?: string;
        };
        Update: {
          periode?: string;
          total_konsultasi?: number;
          fc_akurasi?: number | null;
          id3_akurasi?: number | null;
          agreement_rate?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: UserRole | null;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
