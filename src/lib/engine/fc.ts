import "server-only";

import type { FCInput, FCOutput, RuleMatch } from "@/lib/engine/types";

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

export function runForwardChaining(input: FCInput): FCOutput {
  const selectedFacts = new Set(input.gejalaTerpilih);
  const matchedRules: RuleMatch[] = [];
  const partialRules: RuleMatch[] = [];
  const scoreByConclusion = new Map<string, number>();

  for (const rule of input.rules) {
    const requiredGejala = rule.gejala.map((item) => item.id);

    if (requiredGejala.length === 0) {
      continue;
    }

    const matchedCount = requiredGejala.filter((gejalaId) =>
      selectedFacts.has(gejalaId),
    ).length;
    const isRuleSatisfied = matchedCount === requiredGejala.length;

    const ruleConfidence = roundScore(
      (matchedCount / requiredGejala.length) * rule.bobot * 100,
    );
    const ruleMatch = {
      rule_id: rule.id,
      kode_rule: rule.kode_rule,
      kesimpulan: rule.kesimpulan,
      confidence: Math.min(ruleConfidence, 100),
      matched_gejala_count: matchedCount,
      required_gejala_count: requiredGejala.length,
    };

    if (!isRuleSatisfied) {
      if (matchedCount > 0) {
        partialRules.push(ruleMatch);
      }

      continue;
    }

    matchedRules.push(ruleMatch);

    scoreByConclusion.set(
      rule.kesimpulan,
      (scoreByConclusion.get(rule.kesimpulan) ?? 0) + ruleConfidence,
    );
  }

  const allScoresEntries = Array.from(scoreByConclusion.entries()).map(
    ([kesimpulan, score]) => [kesimpulan, Math.min(roundScore(score), 100)] as const,
  );
  const allScores = Object.fromEntries(allScoresEntries);
  const [bestConclusion, bestScore] = allScoresEntries.sort(
    (a, b) => b[1] - a[1],
  )[0] ?? [null, 0];

  return {
    kesimpulan: bestConclusion,
    confidence: bestScore,
    rules_matched: matchedRules.sort((a, b) => b.confidence - a.confidence),
    rules_partial: partialRules.sort((a, b) => {
      const ratioA = a.matched_gejala_count / a.required_gejala_count;
      const ratioB = b.matched_gejala_count / b.required_gejala_count;

      return ratioB - ratioA || b.confidence - a.confidence;
    }),
    all_scores: allScores,
  };
}
