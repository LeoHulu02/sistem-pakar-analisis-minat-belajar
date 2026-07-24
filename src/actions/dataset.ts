"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDatabaseError } from "@/lib/utils/error";
import type { Json } from "@/types/database";

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi`);
  }

  return value;
}

function getOptionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function getSelectedGejalaCodes(formData: FormData) {
  return formData
    .getAll("gejala_codes")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function buildFiturJson(gejalaCodes: string[]): Json {
  return Object.fromEntries(gejalaCodes.map((kode) => [kode, true]));
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

export async function createDatasetAction(formData: FormData) {
  const returnTo = getReturnPath(formData, "/admin/dataset");
  const gejalaCodes = getSelectedGejalaCodes(formData);

  if (gejalaCodes.length === 0) {
    redirectWithError(
      returnTo,
      "Pilih minimal satu fitur gejala untuk dataset ID3",
    );
  }

  let payload;
  try {
    payload = {
      label: getRequiredString(formData, "label"),
      tahun_ajaran: getOptionalString(formData, "tahun_ajaran"),
      fitur: buildFiturJson(gejalaCodes),
    };
  } catch (err) {
    redirectWithError(returnTo, formatDatabaseError(err));
  }

  const supabase = createClient();
  const { error } = await supabase.from("dataset_id3").insert(payload);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/admin/dataset");
  redirect(returnTo);
}

export async function updateDatasetAction(formData: FormData) {
  const returnTo = getReturnPath(formData, "/admin/dataset");
  const gejalaCodes = getSelectedGejalaCodes(formData);

  if (gejalaCodes.length === 0) {
    redirectWithError(
      returnTo,
      "Pilih minimal satu fitur gejala untuk dataset ID3",
    );
  }

  let id = "";
  let payload;
  try {
    id = getRequiredString(formData, "id");
    payload = {
      label: getRequiredString(formData, "label"),
      tahun_ajaran: getOptionalString(formData, "tahun_ajaran"),
      fitur: buildFiturJson(gejalaCodes),
    };
  } catch (err) {
    redirectWithError(returnTo, formatDatabaseError(err));
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("dataset_id3")
    .update(payload)
    .eq("id", id);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/admin/dataset");
  redirect(returnTo);
}

export async function deleteDatasetAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const returnTo = getReturnPath(formData, "/admin/dataset");
  const supabase = createClient();
  const { error } = await supabase.from("dataset_id3").delete().eq("id", id);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/admin/dataset");
  redirect(returnTo);
}
