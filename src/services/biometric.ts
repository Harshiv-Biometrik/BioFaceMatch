export const cosineSimilarity = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length);
  if (length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i += 1) {
    const av = a[i];
    const bv = b[i];
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
};

export const euclideanDistance = (a: number[], b: number[]): number => {
  const length = Math.min(a.length, b.length);
  if (length === 0) return Number.POSITIVE_INFINITY;

  let sum = 0;
  for (let i = 0; i < length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

export const matchEmbeddings = (reference: number[], probe: number[], threshold = 0.78) => {
  console.log(`[Biometrics] Reference Embedding Size: ${reference.length}`);
  console.log(`[Biometrics] Probe Embedding Size: ${probe.length}`);
  const similarity = cosineSimilarity(reference, probe);
  const distance = euclideanDistance(reference, probe);
  console.log(`[Biometrics] Cosine Similarity: ${similarity.toFixed(4)}`);
  console.log(`[Biometrics] Euclidean Distance: ${distance.toFixed(4)}`);
  console.log(`[Biometrics] Threshold: ${threshold}, isMatch: ${similarity >= threshold}`);

  return {
    similarity,
    distance,
    threshold,
    isMatch: similarity >= threshold,
  };
};
