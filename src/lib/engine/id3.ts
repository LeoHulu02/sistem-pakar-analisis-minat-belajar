import "server-only";

import type { DataPoint, ID3Output, MinatLabel, TreeNode } from "@/lib/engine/types";

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function getLabelDistribution(dataset: DataPoint[]) {
  const distribution: Record<string, number> = {};

  for (const point of dataset) {
    distribution[point.label] = (distribution[point.label] ?? 0) + 1;
  }

  return distribution;
}

function getMajorityLabel(dataset: DataPoint[]): {
  label: MinatLabel | null;
  confidence: number;
} {
  if (dataset.length === 0) {
    return { label: null, confidence: 0 };
  }

  const distribution = getLabelDistribution(dataset);
  const [label, count] = Object.entries(distribution).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return {
    label,
    confidence: roundScore((count / dataset.length) * 100),
  };
}

function createLeaf(dataset: DataPoint[], value?: boolean): TreeNode {
  const majority = getMajorityLabel(dataset);

  return {
    value,
    label: majority.label ?? undefined,
    confidence: majority.confidence,
    samples: dataset.length,
    distribution: getLabelDistribution(dataset),
  };
}

function getAllAttributes(dataset: DataPoint[]) {
  return Array.from(
    dataset.reduce((attributes, point) => {
      Object.keys(point.fitur).forEach((attribute) => attributes.add(attribute));
      return attributes;
    }, new Set<string>()),
  );
}

export function calculateEntropy(labels: string[]) {
  if (labels.length === 0) {
    return 0;
  }

  const counts = labels.reduce<Record<string, number>>((acc, label) => {
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});

  return Object.values(counts).reduce((entropy, count) => {
    const probability = count / labels.length;
    return entropy - probability * Math.log2(probability);
  }, 0);
}

export function calculateGain(dataset: DataPoint[], attribute: string) {
  const baseEntropy = calculateEntropy(dataset.map((point) => point.label));
  const partitions = [true, false].map((value) =>
    dataset.filter((point) => Boolean(point.fitur[attribute]) === value),
  );

  const weightedEntropy = partitions.reduce((total, subset) => {
    const weight = subset.length / dataset.length;
    return total + weight * calculateEntropy(subset.map((point) => point.label));
  }, 0);

  return baseEntropy - weightedEntropy;
}

export function buildTree(
  dataset: DataPoint[],
  attributes = getAllAttributes(dataset),
  value?: boolean,
): TreeNode {
  if (dataset.length === 0) {
    return createLeaf(dataset, value);
  }

  const labels = dataset.map((point) => point.label);
  const uniqueLabels = new Set(labels);

  if (uniqueLabels.size === 1 || attributes.length === 0) {
    return createLeaf(dataset, value);
  }

  const [bestAttribute] = attributes
    .map((attribute) => ({
      attribute,
      gain: calculateGain(dataset, attribute),
    }))
    .sort((a, b) => b.gain - a.gain);

  if (!bestAttribute || bestAttribute.gain <= 0) {
    return createLeaf(dataset, value);
  }

  const remainingAttributes = attributes.filter(
    (attribute) => attribute !== bestAttribute.attribute,
  );
  const majority = getMajorityLabel(dataset);

  return {
    value,
    attribute: bestAttribute.attribute,
    label: majority.label ?? undefined,
    confidence: majority.confidence,
    samples: dataset.length,
    distribution: getLabelDistribution(dataset),
    children: [false, true].map((branchValue) =>
      buildTree(
        dataset.filter(
          (point) => Boolean(point.fitur[bestAttribute.attribute]) === branchValue,
        ),
        remainingAttributes,
        branchValue,
      ),
    ),
  };
}

export function predict(tree: TreeNode, input: Record<string, boolean>): ID3Output {
  const path: ID3Output["path"] = [];
  let current = tree;

  while (current.attribute && current.children?.length) {
    const value = Boolean(input[current.attribute]);
    path.push({ attribute: current.attribute, value });

    const next = current.children.find((child) => child.value === value);

    if (!next || next.samples === 0) {
      break;
    }

    current = next;
  }

  return {
    kesimpulan: current.label ?? null,
    confidence: current.confidence ?? 0,
    path,
  };
}
