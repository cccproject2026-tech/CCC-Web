/**
 * Unwraps GET /users (and similar) responses so list + pagination work
 * whether the payload is `data: { users, total }` or double-wrapped.
 */
export function parseMentorUsersListResponse(res: { data?: unknown }): {
  users: Record<string, unknown>[];
  total: number;
  totalPages: number;
} {
  const root = res?.data as Record<string, unknown> | undefined;
  if (root == null) return { users: [], total: 0, totalPages: 1 };
  const body =
    root.data != null && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const usersRaw = (body as { users?: unknown }).users;
  const users = Array.isArray(usersRaw)
    ? (usersRaw as Record<string, unknown>[])
    : Array.isArray(body)
      ? (body as Record<string, unknown>[])
      : [];
  return {
    users,
    total:
      typeof (body as { total?: number }).total === "number"
        ? (body as { total: number }).total
        : users.length,
    totalPages:
      typeof (body as { totalPages?: number }).totalPages === "number"
        ? (body as { totalPages: number }).totalPages
        : 1,
  };
}
