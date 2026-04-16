import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorUserId } from "@/app/utils/mentor-auth";

function normalizeId(value: unknown): string {
  return String(value ?? "").trim();
}

export async function verifyMentorPastorAccess(
  pastorUserId: string | null | undefined,
): Promise<
  | { ok: true; mentorId: string; pastorUserId: string }
  | { ok: false; reason: string }
> {
  const mentorId = getMentorUserId();
  if (!mentorId) {
    return { ok: false, reason: "No mentor session found." };
  }

  const pastorId = normalizeId(pastorUserId);
  if (!pastorId) {
    return { ok: false, reason: "Missing pastor userId." };
  }

  try {
    const res = await apiGetAssignedUsers(mentorId);
    const body = res.data as { data?: unknown };
    const assigned = Array.isArray(body?.data) ? body.data : [];
    const isAssigned = assigned.some((item: any) => {
      const id = normalizeId(item?._id ?? item?.id);
      return id === pastorId;
    });

    if (!isAssigned) {
      return {
        ok: false,
        reason: "This pastor is not assigned to the current mentor.",
      };
    }

    return { ok: true, mentorId, pastorUserId: pastorId };
  } catch (error) {
    console.error("[mentor-link] failed to verify mentor/pastor access", error);
    return { ok: false, reason: "Could not verify mentor to pastor access." };
  }
}
