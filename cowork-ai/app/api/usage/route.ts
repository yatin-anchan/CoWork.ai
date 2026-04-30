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

// Rough pricing per token (adjust later)
const PRICING: Record<string, number> = {
  google: 0.000002,
  groq: 0.000001,
  openrouter: 0.000002,
  anthropic: 0.000003,
  openai: 0.0000025,
  perplexity: 0.000002,
};

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // 🔑 Connected providers
  const connectedProviders = await sql`
    SELECT provider, status
    FROM user_api_keys
    WHERE user_id = ${user.userId}
    AND status = 'active'
    ORDER BY provider ASC
  `;

  // 📊 Usage today (with provider support)
  const todayUsage = await sql`
    SELECT 
      model,
      COALESCE(provider, 'unknown') as provider,
      SUM(tokens_used)::int AS tokens_used
    FROM contexts
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = ${user.userId}
    )
    AND model IS NOT NULL
    AND timestamp >= CURRENT_DATE
    GROUP BY model, provider
    ORDER BY tokens_used DESC
  `;

  // 📈 Usage by day
  const usageByDay = await sql`
    SELECT 
      DATE(timestamp) AS date, 
      SUM(tokens_used)::int AS tokens_used
    FROM contexts
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = ${user.userId}
    )
    AND timestamp >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY DATE(timestamp)
    ORDER BY date ASC
  `;

  // 🧠 Total tokens
  const totalTokensToday = todayUsage.reduce(
    (sum: number, item: any) => sum + Number(item.tokens_used || 0),
    0
  );

  // 💰 Cost calculation
  let totalCostToday = 0;

  const usageWithCost = todayUsage.map((item: any) => {
    const provider = item.provider || "unknown";
    const tokens = Number(item.tokens_used || 0);

    const costPerToken = PRICING[provider] || 0;
    const cost = tokens * costPerToken;

    totalCostToday += cost;

    return {
      ...item,
      cost,
    };
  });

  // 🧩 Provider aggregation (REAL FIX)
  const providerMap: Record<
    string,
    { tokens: number; cost: number }
  > = {};

  usageWithCost.forEach((item: any) => {
    const provider = item.provider || "unknown";

    if (!providerMap[provider]) {
      providerMap[provider] = { tokens: 0, cost: 0 };
    }

    providerMap[provider].tokens += Number(item.tokens_used || 0);
    providerMap[provider].cost += item.cost || 0;
  });

  // 📊 Provider usage with limits
  const providerUsage = connectedProviders.map((provider: any) => {
    const data = providerMap[provider.provider] || {
      tokens: 0,
      cost: 0,
    };

    const limit = MODEL_LIMITS[provider.provider] || 100_000;

    return {
      provider: provider.provider,
      limit,
      usedToday: data.tokens,
      remaining: Math.max(limit - data.tokens, 0),
      costToday: data.cost,
    };
  });

  // 🤖 Team Mode usage
  const teamModeUsage = await sql`
    SELECT COUNT(*)::int AS count
    FROM contexts
    WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = ${user.userId}
    )
    AND model = 'team-mode'
    AND timestamp >= CURRENT_DATE
  `;

  return NextResponse.json({
    totalTokensToday,
    totalCostToday,
    mostUsedModel:
      usageWithCost.length > 0 ? usageWithCost[0].model : null,

    usageByModel: usageWithCost,
    usageByDay,

    connectedProviders,
    providerUsage,

    teamModeUsage: teamModeUsage[0]?.count || 0,
  });
}