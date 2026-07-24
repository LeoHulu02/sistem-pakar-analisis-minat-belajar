export function formatDatabaseError(
  error: unknown,
  fallbackMessage = "Terjadi kesalahan saat menyimpan data ke database.",
): string {
  if (!error) return fallbackMessage;

  const rawMsg =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error);

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";

  const lowerMsg = rawMsg.toLowerCase();

  // Postgres unique violation (23505) or duplicate key error
  if (
    code === "23505" ||
    lowerMsg.includes("duplicate key") ||
    lowerMsg.includes("unique constraint") ||
    lowerMsg.includes("already exists")
  ) {
    if (lowerMsg.includes("nis")) {
      return "Data gagal ditambahkan: NIS siswa tersebut sudah terdaftar di database. Silakan gunakan NIS lain.";
    }
    if (lowerMsg.includes("kode_rule")) {
      return "Data gagal ditambahkan: Kode Rule tersebut sudah terdaftar di database. Silakan gunakan Kode Rule lain.";
    }
    if (
      lowerMsg.includes("gejala_kode") ||
      lowerMsg.includes("kode")
    ) {
      return "Data gagal ditambahkan: Kode Mata Pelajaran / Gejala tersebut sudah terdaftar di database. Silakan gunakan Kode lain.";
    }
    if (lowerMsg.includes("email")) {
      return "Data gagal disimpan: Email tersebut sudah terdaftar di database.";
    }
    return "Data gagal ditambahkan: ID / Kode tersebut sudah terdaftar di database. Silakan periksa kembali inputan Anda.";
  }

  // Postgres foreign key violation (23503)
  if (code === "23503" || lowerMsg.includes("foreign key")) {
    return "Data gagal diproses: Referensi data terkait tidak ditemukan atau masih digunakan oleh data lain.";
  }

  // Postgres check / not-null violation (23502)
  if (code === "23502" || lowerMsg.includes("not-null")) {
    return "Data gagal disimpan: Mohon lengkapi seluruh kolom inputan yang wajib diisi.";
  }

  return rawMsg || fallbackMessage;
}
