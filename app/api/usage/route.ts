import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";

const MODEL_LIMITS: Record<string, number> = {
  google: 1_000_000,
  groq: 500_000,
  openrouter: 300_000,
  anthropic: 200_000,
  openai: 250_000,
  perplexity: 200_000,
};

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const connectedProviders = await sql`
    SELECT provider, status
    FROM user_api_keys
    WHERE user_id = ${user.userId}
    AND status = 'active'
    ORDER BY provider ASC
  `;

  const todayUsage = await sql`
    SELECT model, SUM(tokens_used)::int AS tokens_used
    FROM contexts
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = ${user.userId}
    )
    AND model IS NOT NULL
    AND timestamp >= CURRENT_DATE
    GROUP BY model
    ORDER BY tokens_used DESC
  `;

  const usageByDay = await sql`
    SELECT DATE(timestamp) AS date, SUM(tokens_used)::int AS tokens_used
    FROM contexts
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = ${user.userId}
    )
    AND timestamp >= CURRENT_DATE - INTERVAL '2 days'
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `;

  const totalTokensToday = todayUsage.reduce(
    (sum: number, item: any) => sum + Number(item.tokens_used || 0),
    0
  );

  const providerUsage = connectedProviders.map((provider: any) => {
    const usedToday = todayUsage
      .filter((item: any) =>
        String(item.model).toLowerCase().includes(provider.provider)
      )
      .reduce(
        (sum: number, item: any) => sum + Number(item.tokens_used || 0),
        0
      );

    const limit = MODEL_LIMITS[provider.provider] || 100_000;

    return {
      provider: provider.provider,
      limit,
      usedToday,
      remaining: Math.max(limit - usedToday, 0),
    };
  });

  return NextResponse.json({
    totalTokensToday,
    mostUsedModel: todayUsage.length > 0 ? todayUsage[0].model : null,
    usageByModel: todayUsage,
    usageByDay,
    connectedProviders,
    providerUsage,
  });
}