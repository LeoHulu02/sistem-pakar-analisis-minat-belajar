"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();

  if (!value) {
    throw new Error(`${key} wajib diisi`);
  }

  return value;
}

function getCheckboxValue(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getGejalaIds(formData: FormData) {
  return formData
    .getAll("gejala_ids")
    .map((value) => String(value))
    .filter(Boolean);
}

function getBobot(formData: FormData) {
  const value = Number(formData.get("bobot") ?? 1);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Bobot harus berupa angka lebih dari 0");
  }

  return value;
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

async function replaceRuleGejala(ruleId: string, gejalaIds: string[]) {
  const supabase = createClient();
  const { error: deleteError } = await supabase
    .from("rule_gejala")
    .delete()
    .eq("rule_id", ruleId);

  if (deleteError) {
    return deleteError;
  }

  if (gejalaIds.length === 0) {
    return null;
  }

  const { error: insertError } = await supabase.from("rule_gejala").insert(
    gejalaIds.map((gejalaId) => ({
      rule_id: ruleId,
      gejala_id: gejalaId,
    })),
  );

  return insertError;
}

export async function createRuleAction(formData: FormData) {
  const returnTo = getReturnPath(formData, "/admin/rules");
  const gejalaIds = getGejalaIds(formData);

  if (gejalaIds.length === 0) {
    redirectWithError(
      returnTo,
      "Pilih minimal satu gejala untuk rule",
    );
  }

  const payload = {
    kode_rule: getRequiredString(formData, "kode_rule").toUpperCase(),
    nama_rule: getRequiredString(formData, "nama_rule"),
    kesimpulan: getRequiredString(formData, "kesimpulan"),
    bobot: getBobot(formData),
    aktif: getCheckboxValue(formData, "aktif"),
  };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("rules_fc")
    .insert(payload)
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError(
      returnTo,
      error?.message ?? "Rule gagal disimpan",
    );
  }

  const mappingError = await replaceRuleGejala(data.id, gejalaIds);

  if (mappingError) {
    await supabase.from("rules_fc").delete().eq("id", data.id);
    redirectWithError(returnTo, mappingError.message);
  }

  revalidatePath("/admin/rules");
  redirect(returnTo);
}

export async function updateRuleAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const returnTo = getReturnPath(formData, "/admin/rules");
  const gejalaIds = getGejalaIds(formData);

  if (gejalaIds.length === 0) {
    redirectWithError(
      returnTo,
      "Pilih minimal satu gejala untuk rule",
    );
  }

  const payload = {
    kode_rule: getRequiredString(formData, "kode_rule").toUpperCase(),
    nama_rule: getRequiredString(formData, "nama_rule"),
    kesimpulan: getRequiredString(formData, "kesimpulan"),
    bobot: getBobot(formData),
    aktif: getCheckboxValue(formData, "aktif"),
  };

  const supabase = createClient();
  const { error } = await supabase.from("rules_fc").update(payload).eq("id", id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  const mappingError = await replaceRuleGejala(id, gejalaIds);

  if (mappingError) {
    redirectWithError(returnTo, mappingError.message);
  }

  revalidatePath("/admin/rules");
  redirect(returnTo);
}

export async function toggleRuleAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const aktif = String(formData.get("aktif") ?? "") === "true";

  const supabase = createClient();
  const { error } = await supabase
    .from("rules_fc")
    .update({ aktif })
    .eq("id", id);

  if (error) {
    redirectWithError("/admin/rules", error.message);
  }

  revalidatePath("/admin/rules");
}

export async function deleteRuleAction(formData: FormData) {
  const id = getRequiredString(formData, "id");
  const returnTo = getReturnPath(formData, "/admin/rules");
  const supabase = createClient();
  const { error } = await supabase.from("rules_fc").delete().eq("id", id);

  if (error) {
    redirectWithError(returnTo, error.message);
  }

  revalidatePath("/admin/rules");
  redirect(returnTo);
}
