export type MinatLabel =
  | "IPA"
  | "IPS"
  | "Bahasa"
  | "Teknologi"
  | "Seni"
  | "Olahraga"
  | string;

export type RuleWithGejala = {
  id: string;
  kode_rule: string;
  nama_rule: string;
  kesimpulan: MinatLabel;
  bobot: number;
  gejala: {
    id: string;
    kode: string;
    deskripsi: string;
  }[];
};

export type RuleMatch = {
  rule_id: string;
  kode_rule: string;
  kesimpulan: MinatLabel;
  confidence: number;
  matched_gejala_count: number;
  required_gejala_count: number;
};

export type FCInput = {
  gejalaTerpilih: string[];
  rules: RuleWithGejala[];
};

export type FCOutput = {
  kesimpulan: MinatLabel | null;
  confidence: number;
  rules_matched: RuleMatch[];
  rules_partial: RuleMatch[];
  all_scores: Record<string, number>;
};

export type DataPoint = {
  label: MinatLabel;
  fitur: Record<string, boolean>;
};

export type TreeNode = {
  attribute?: string;
  value?: boolean;
  label?: MinatLabel;
  confidence?: number;
  samples: number;
  distribution: Record<string, number>;
  children?: TreeNode[];
};

export type ID3Output = {
  kesimpulan: MinatLabel | null;
  confidence: number;
  path: {
    attribute: string;
    value: boolean;
  }[];
};

export type ComparisonOutput = {
  agreement: boolean;
  final_kesimpulan: MinatLabel | null;
  confidence_diff: number;
  recommendation_note: string;
};
