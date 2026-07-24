"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDatabaseError } from "@/lib/utils/error";
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
  let payload;
  try {
    payload = {
      nis: getRequiredString(formData, "nis"),
      nama: getRequiredString(formData, "nama"),
      kelas: getRequiredString(formData, "kelas"),
      tahun_ajaran: getRequiredString(formData, "tahun_ajaran"),
      jenis_kelamin: getOptionalJenisKelamin(formData),
    };
  } catch (err) {
    redirectWithError(returnTo, formatDatabaseError(err));
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("siswa")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      returnTo,
      formatDatabaseError(error, "Data siswa gagal disimpan"),
    );
  }

  revalidatePath("/siswa");
  redirect(returnTo);
}

export async function updateSiswaAction(formData: FormData) {
  let id = "";
  let payload;
  const rawReturnTo = String(formData.get("return_to") ?? "").trim();
  let returnTo = rawReturnTo.startsWith("/") && !rawReturnTo.startsWith("//") ? rawReturnTo : "/siswa";

  try {
    id = getRequiredString(formData, "id");
    if (!rawReturnTo) {
      returnTo = `/siswa/${id}`;
    }
    payload = {
      nis: getRequiredString(formData, "nis"),
      nama: getRequiredString(formData, "nama"),
      kelas: getRequiredString(formData, "kelas"),
      tahun_ajaran: getRequiredString(formData, "tahun_ajaran"),
      jenis_kelamin: getOptionalJenisKelamin(formData),
    };
  } catch (err) {
    redirectWithError(returnTo, formatDatabaseError(err));
  }

  const supabase = createClient();
  const { error } = await supabase.from("siswa").update(payload).eq("id", id);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
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
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/siswa");
  redirect(returnTo);
}
