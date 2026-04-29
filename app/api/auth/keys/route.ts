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

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
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
        AND user_id = ${user.userId}
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

export async function DELETE(req: NextRequest) {
  try {
    const user = getAuthUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Valid key id is required." },
        { status: 400 }
      );
    }

    const deleted = await sql`
      DELETE FROM user_api_keys
      WHERE id = ${parsed.data.id}
      AND user_id = ${user.userId}
      RETURNING id, provider
    `;

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "API key not found." },
        { status: 404 }
      );
    }

    await sql`
      DELETE FROM role_assignments
      WHERE user_id = ${user.userId}
      AND provider = ${deleted[0].provider}
    `;

    return NextResponse.json({
      message: "API key deleted successfully.",
      deleted: deleted[0],
    });
  } catch (error) {
    console.error("Delete API key error:", error);

    return NextResponse.json(
      { error: "Failed to delete API key." },
      { status: 500 }
    );
  }
}