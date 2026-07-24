"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDatabaseError } from "@/lib/utils/error";

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

function getCheckboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
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

export async function createGejalaAction(formData: FormData) {
  const returnTo = getReturnPath(formData, "/admin/gejala");
  let payload;
  try {
    payload = {
      kode: getRequiredString(formData, "kode").toUpperCase(),
      deskripsi: getRequiredString(formData, "deskripsi"),
      kategori: getOptionalString(formData, "kategori"),
      aktif: getCheckboxValue(formData, "aktif"),
    };
  } catch (err) {
    redirectWithError(returnTo, formatDatabaseError(err));
  }

  const supabase = createClient();
  const { error } = await supabase.from("gejala").insert(payload);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/admin/gejala");
  redirect(returnTo);
}

export async function updateGejalaAction(formData: FormData) {
  const returnTo = getReturnPath(formData, "/admin/gejala");
  let id = "";
  let payload;
  try {
    id = getRequiredString(formData, "id");
    payload = {
      kode: getRequiredString(formData, "kode").toUpperCase(),
      deskripsi: getRequiredString(formData, "deskripsi"),
      kategori: getOptionalString(formData, "kategori"),
      aktif: getCheckboxValue(formData, "aktif"),
    };
  } catch (err) {
    redirectWithError(returnTo, formatDatabaseError(err));
  }

  const supabase = createClient();
  const { error } = await supabase.from("gejala").update(payload).eq("id", id);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/admin/gejala");
  redirect(returnTo);
}

export async function toggleGejalaAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const aktif = String(formData.get("aktif") ?? "") === "true";

  const supabase = createClient();
  const { error } = await supabase.from("gejala").update({ aktif }).eq("id", id);

  if (error) {
    redirectWithError("/admin/gejala", formatDatabaseError(error));
  }

  revalidatePath("/admin/gejala");
}

export async function deleteGejalaAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const returnTo = getReturnPath(formData, "/admin/gejala");
  const supabase = createClient();
  const { error } = await supabase.from("gejala").delete().eq("id", id);

  if (error) {
    redirectWithError(returnTo, formatDatabaseError(error));
  }

  revalidatePath("/admin/gejala");
  redirect(returnTo);
}
