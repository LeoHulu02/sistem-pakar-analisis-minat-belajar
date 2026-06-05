"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { JenisKelamin } from "@/types/database";

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi`);
  }

  return value;
}

function getOptionalJenisKelamin(formData: FormData): JenisKelamin | null {
  const value = String(formData.get("jenis_kelamin") ?? "").trim();

  if (value === "L" || value === "P") {
    return value;
  }

  return null;
}

function redirectWithError(path: string, message: string): never {
  const separator = path.includes("?") ? "&" : "?";
  const params = new URLSearchParams({ error: message });
  redirect(`${path}${separator}${params.toString()}`);
}

function getReturnPath(formData: FormData, fallback: string) {
  const value = String(formData.get("return_to") ?? "").trim();

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return fallback;
}

export async function createSiswaAction(formData: FormData) {
  const returnTo = getReturnPath(formData, "/siswa");
  const payload = {
    nis: getRequiredString(formData, "nis"),
    nama: getRequiredString(formData, "nama"),
    kelas: getRequiredString(formData, "kelas"),
    tahun_ajaran: getRequiredString(formData, "tahun_ajaran"),
    jenis_kelamin: getOptionalJenisKelamin(formData),
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("siswa")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      returnTo,
      error?.message ?? "Data siswa gagal disimpan",
    );
  }

  revalidatePath("/siswa");
  redirect(returnTo);
}

export async function updateSiswaAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const returnTo = getReturnPath(formData, `/siswa/${id}`);
  const payload = {
    nis: getRequiredString(formData, "nis"),
    nama: getRequiredString(formData, "nama"),
    kelas: getRequiredString(formData, "kelas"),
    tahun_ajaran: getRequiredString(formData, "tahun_ajaran"),
    jenis_kelamin: getOptionalJenisKelamin(formData),
  };

  const supabase = createClient();
  const { error } = await supabase.from("siswa").update(payload).eq("id", id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidatePath("/siswa");
  revalidatePath(`/siswa/${id}`);
  redirect(returnTo);
}

export async function deleteSiswaAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const returnTo = getReturnPath(formData, "/siswa");
  const supabase = createClient();
  const { error } = await supabase.from("siswa").delete().eq("id", id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidatePath("/siswa");
  redirect(returnTo);
}
