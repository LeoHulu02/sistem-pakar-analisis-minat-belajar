"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { compareInferenceResults } from "@/lib/engine/comparison";
import { runForwardChaining } from "@/lib/engine/fc";
import { buildTree, predict } from "@/lib/engine/id3";
import type { DataPoint, ID3Output, RuleWithGejala } from "@/lib/engine/types";
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

function getSelectedGejalaIds(formData: FormData) {
  return formData
    .getAll("gejala_ids")
    .map((value) => String(value))
    .filter(Boolean);
}

function redirectWithError(path: string, message: string): never {
  const params = new URLSearchParams({ error: message });
  redirect(`${path}?${params.toString()}`);
}

async function loadForwardChainingRules(): Promise<RuleWithGejala[]> {
  const supabase = createClient();
  const [{ data: rules, error: rulesError }, { data: mappings }, { data: gejala }] =
    await Promise.all([
      supabase.from("rules_fc").select("*").eq("aktif", true),
      supabase.from("rule_gejala").select("rule_id, gejala_id"),
      supabase.from("gejala").select("id, kode, deskripsi").eq("aktif", true),
    ]);

  if (rulesError) {
    throw new Error(rulesError.message);
  }

  const gejalaById = new Map((gejala ?? []).map((item) => [item.id, item]));
  const gejalaIdsByRule = new Map<string, string[]>();

  for (const mapping of mappings ?? []) {
    const current = gejalaIdsByRule.get(mapping.rule_id) ?? [];
    current.push(mapping.gejala_id);
    gejalaIdsByRule.set(mapping.rule_id, current);
  }

  return (rules ?? []).map((rule) => ({
    id: rule.id,
    kode_rule: rule.kode_rule,
    nama_rule: rule.nama_rule,
    kesimpulan: rule.kesimpulan,
    bobot: Number(rule.bobot),
    gejala: (gejalaIdsByRule.get(rule.id) ?? [])
      .map((gejalaId) => gejalaById.get(gejalaId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
  }));
}

function parseFitur(value: Json): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, rawValue]) => [key, Boolean(rawValue)]),
  );
}

async function loadID3Dataset(): Promise<DataPoint[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("dataset_id3").select("*");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    label: row.label,
    fitur: parseFitur(row.fitur),
  }));
}

async function buildID3Input(gejalaIds: string[]) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gejala")
    .select("id, kode")
    .in("id", gejalaIds);

  if (error) {
    throw new Error(error.message);
  }

  const input: Record<string, boolean> = {};

  for (const gejalaId of gejalaIds) {
    input[gejalaId] = true;
  }

  for (const item of data ?? []) {
    input[item.kode] = true;
  }

  return input;
}

export async function createKonsultasiAction(formData: FormData) {
  const siswaId = getRequiredString(formData, "siswa_id");
  const gejalaIds = getSelectedGejalaIds(formData);

  if (gejalaIds.length === 0) {
    redirectWithError(
      `/konsultasi/new?siswa_id=${siswaId}`,
      "Pilih minimal satu gejala untuk menjalankan konsultasi",
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: konsultasi, error: konsultasiError } = await supabase
    .from("konsultasi")
    .insert({
      siswa_id: siswaId,
      created_by: user?.id ?? null,
      status: "pending",
    })
    .select("id")
    .single();

  if (konsultasiError || !konsultasi) {
    redirectWithError(
      `/konsultasi/new?siswa_id=${siswaId}`,
      formatDatabaseError(konsultasiError, "Konsultasi gagal dibuat"),
    );
  }

  const { error: gejalaError } = await supabase.from("konsultasi_gejala").insert(
    gejalaIds.map((gejalaId) => ({
      konsultasi_id: konsultasi.id,
      gejala_id: gejalaId,
    })),
  );

  if (gejalaError) {
    await supabase.from("konsultasi").delete().eq("id", konsultasi.id);
    redirectWithError(`/konsultasi/new?siswa_id=${siswaId}`, formatDatabaseError(gejalaError));
  }

  try {
    const rules = await loadForwardChainingRules();
    const fcResult = runForwardChaining({
      gejalaTerpilih: gejalaIds,
      rules,
    });
    const dataset = await loadID3Dataset();
    const id3Result: ID3Output =
      dataset.length > 0
        ? predict(buildTree(dataset), await buildID3Input(gejalaIds))
        : {
            kesimpulan: null,
            confidence: 0,
            path: [],
          };
    const comparison = compareInferenceResults({
      fc: fcResult,
      id3: id3Result,
    });

    const { error: hasilError } = await supabase.from("hasil_diagnosa").insert({
      konsultasi_id: konsultasi.id,
      fc_kesimpulan: fcResult.kesimpulan,
      fc_confidence: fcResult.confidence,
      fc_rules_matched: {
        matched: fcResult.rules_matched,
        partial: fcResult.rules_partial,
      },
      id3_kesimpulan: id3Result.kesimpulan,
      id3_confidence: id3Result.confidence,
      id3_path: id3Result.path,
      agreement: comparison.agreement,
      final_kesimpulan: comparison.final_kesimpulan,
    });

    if (hasilError) {
      throw new Error(hasilError.message);
    }

    const { error: updateError } = await supabase
      .from("konsultasi")
      .update({ status: "selesai" })
      .eq("id", konsultasi.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } catch (error) {
    await supabase.from("konsultasi").delete().eq("id", konsultasi.id);
    redirectWithError(
      `/konsultasi/new?siswa_id=${siswaId}`,
      error instanceof Error ? error.message : "Inference gagal dijalankan",
    );
  }

  revalidatePath("/dashboard");
  revalidatePath("/siswa");
  redirect(`/konsultasi/${konsultasi.id}/hasil`);
}
