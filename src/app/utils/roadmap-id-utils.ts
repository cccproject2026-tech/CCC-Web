const ID_KEYS = ["_id", "id", "roadmapId", "roadMapId"] as const;

export function normalizeComparableId(value: unknown, seen = new Set<object>()): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "bigint") {
    return String(value).trim();
  }

  if (typeof value !== "object") {
    return "";
  }

  if (seen.has(value)) {
    return "";
  }

  seen.add(value);

  const record = value as Record<string, unknown>;
  for (const key of ID_KEYS) {
    const resolved = normalizeComparableId(record[key], seen);
    if (resolved) {
      return resolved;
    }
  }

  return "";
}

export function idsMatch(left: unknown, right: unknown): boolean {
  const leftId = normalizeComparableId(left);
  const rightId = normalizeComparableId(right);
  return Boolean(leftId && rightId && leftId === rightId);
}
