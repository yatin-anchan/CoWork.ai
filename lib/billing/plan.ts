import { sql } from "@/lib/db/neon";

export type UserPlan = "free" | "pro";

export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxFilesPerProject: 5,
    canUseTeamMode: false,
    canUsePrivateChats: false,
    canInviteRoles: ["viewer"],
    canManageMembers: false,
    canViewFullAnalytics: false,
  },
  pro: {
    maxProjects: Infinity,
    maxFilesPerProject: 30,
    canUseTeamMode: true,
    canUsePrivateChats: true,
    canInviteRoles: ["viewer", "editor", "owner"],
    canManageMembers: true,
    canViewFullAnalytics: true,
  },
} as const;

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const rows = await sql`
    SELECT plan
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  return rows[0]?.plan === "pro" ? "pro" : "free";
}

export function getPlanLimits(plan: UserPlan) {
  return PLAN_LIMITS[plan];
}

export function isPro(plan: UserPlan) {
  return plan === "pro";
}