import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { getAuthUser } from "@/lib/auth/middleware";
import { encryptText } from "@/lib/crypto/encrypt";

const allowedProviders = [
  "google",
  "groq",
  "openrouter",
  "anthropic",
  "openai",
  "perplexity",
  "custom",
] as const;

const keySchema = z.object({
  provider: z.enum(allowedProviders),
  apiKey: z.string().min(1).optional(),
  modelConfig: z
    .object({
      name: z.string().min(1),
      baseUrl: z.string().url(),
      modelId: z.string().min(1),
    })
    .optional(),
});

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const keys = await sql`
    SELECT id, provider, model_config, status, created_at, updated_at
    FROM user_api_keys
    WHERE user_id = ${user.userId}
    ORDER BY created_at DESC
  `;

  return NextResponse.json({ keys });
}

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = keySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid API key payload." },
        { status: 400 }
      );
    }

    const { provider, apiKey, modelConfig } = parsed.data;

    if (provider !== "custom" && !apiKey) {
      return NextResponse.json(
        { error: "API key is required for this provider." },
        { status: 400 }
      );
    }

    if (provider === "custom" && !modelConfig) {
      return NextResponse.json(
        { error: "Custom model configuration is required." },
        { status: 400 }
      );
    }

    const encryptedKey = apiKey ? encryptText(apiKey) : null;

    const existing = await sql`
      SELECT id FROM user_api_keys
      WHERE user_id = ${user.userId}
      AND provider = ${provider}
      LIMIT 1
    `;

    if (existing.length > 0 && provider !== "custom") {
      const updated = await sql`
        UPDATE user_api_keys
        SET encrypted_key = ${encryptedKey},
            model_config = ${modelConfig ? JSON.stringify(modelConfig) : null},
            status = 'active',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existing[0].id}
        RETURNING id, provider, model_config, status, created_at, updated_at
      `;

      return NextResponse.json({
        message: "API key updated successfully.",
        key: updated[0],
      });
    }

    const inserted = await sql`
      INSERT INTO user_api_keys (
        user_id,
        provider,
        encrypted_key,
        model_config,
        status
      )
      VALUES (
        ${user.userId},
        ${provider},
        ${encryptedKey},
        ${modelConfig ? JSON.stringify(modelConfig) : null},
        'active'
      )
      RETURNING id, provider, model_config, status, created_at, updated_at
    `;

    return NextResponse.json(
      {
        message: "API key saved successfully.",
        key: inserted[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Save API key error:", error);

    return NextResponse.json(
      { error: "Failed to save API key." },
      { status: 500 }
    );
  }
}