/**
 * Unwraps GET /users (and similar) responses so list + pagination work
 * whether the payload is `data: { users, total }`, `data` as a raw user array,
 * or extra-nested `data: { data: { users } }` (see director home `readUsersPage`).
 */
export function parseMentorUsersListResponse(res: { data?: unknown }): {
  users: Record<string, unknown>[];
  total: number;
  totalPages: number;
} {
  const root = res?.data as Record<string, unknown> | undefined;
  if (root == null) return { users: [], total: 0, totalPages: 1 };

  const inner = root.data;
  if (Array.isArray(inner)) {
    const users = inner as Record<string, unknown>[];
    return { users, total: users.length, totalPages: 1 };
  }

  const body =
    inner != null && typeof inner === "object" && !Array.isArray(inner)
      ? (inner as Record<string, unknown>)
      : root;

  type C = { users?: unknown; total?: number; totalPages?: number; data?: unknown; rows?: unknown };
  const b = body as C;
  const rootTop = root as C;

  let usersRaw: unknown = b.users;
  if (!Array.isArray(usersRaw) && b.data != null && typeof b.data === "object") {
    const mid = b.data as C;
    if (Array.isArray(mid.users)) usersRaw = mid.users;
    else if (Array.isArray(mid.data)) usersRaw = mid.data;
    else if (mid.data != null && typeof mid.data === "object" && !Array.isArray(mid.data)) {
      const deep = mid.data as C;
      if (Array.isArray(deep.users)) usersRaw = deep.users;
    }
  }
  if (!Array.isArray(usersRaw) && Array.isArray(b.rows)) usersRaw = b.rows;
  if (!Array.isArray(usersRaw) && Array.isArray(rootTop.users)) usersRaw = rootTop.users;
  if (!Array.isArray(usersRaw) && Array.isArray((root as { rows?: unknown }).rows)) {
    usersRaw = (root as { rows: unknown[] }).rows;
  }

  const users: Record<string, unknown>[] = Array.isArray(usersRaw)
    ? (usersRaw as Record<string, unknown>[])
    : Array.isArray(body)
      ? (body as Record<string, unknown>[])
      : [];

  const midForMeta = b.data as C | undefined;
  const total =
    typeof b.total === "number"
      ? b.total
      : midForMeta && typeof midForMeta.total === "number"
        ? midForMeta.total
        : users.length;
  const totalPages =
    typeof b.totalPages === "number"
      ? b.totalPages
      : midForMeta && typeof midForMeta.totalPages === "number"
        ? midForMeta.totalPages
        : 1;

  return { users, total, totalPages };
}
