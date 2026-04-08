/**
 * After login, backend may only set `_id`. Persist `id` alias so older screens work.
 */
export function normalizeUserCookieForClient(
  user: Record<string, unknown>,
): Record<string, unknown> {
  const id = user.id ?? user._id;
  if (id == null) return user;
  return { ...user, id: String(id) };
}
