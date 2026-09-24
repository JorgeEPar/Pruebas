import "server-only";

import { prisma } from "@/lib/prisma";

export const INVITE_COOKIE = "invite_code";

export async function validateInvite(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const invite = await prisma.inviteCode.findUnique({
    where: { code: normalized },
  });
  if (!invite || invite.revoked || invite.uses >= invite.maxUses) return null;
  return invite;
}
