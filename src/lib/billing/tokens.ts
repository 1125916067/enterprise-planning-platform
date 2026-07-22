export function estimateTokens(text: string) {
  return Math.max(1, Math.ceil(text.length / 12));
}

export function estimateJsonTokens(value: unknown) {
  try {
    return estimateTokens(JSON.stringify(value));
  } catch {
    return estimateTokens(String(value));
  }
}
