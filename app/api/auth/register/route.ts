import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { hashPassword } from "@/lib/auth/hash";
import { signToken } from "@/lib/auth/jwt";
import { sendWelcomeEmail } from "@/lib/email/resend";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().int().min(13).max(120).nullable().optional(),
  dob: z.string().nullable().optional(),
  gender: z.string().max(50).nullable().optional(),
  mobileNumber: z.string().max(30).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  occupation: z.string().max(100).nullable().optional(),
  describesYou: z.string().max(100).nullable().optional(),
  intention: z.array(z.string()).nullable().optional(),
  useCase: z.string().max(1000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = registerSchema.safeParse(body);

if (!parsed.success) {
  const issues = parsed.error.issues;
  console.error("[register] zod issues:", JSON.stringify(issues, null, 2));

  const firstIssue = issues[0];

  if (!firstIssue) {
    console.error("[register] empty issues array, raw body:", JSON.stringify(body, null, 2));
    return NextResponse.json(
      { error: "Invalid registration data." },
      { status: 400 }
    );
  }

  const field = firstIssue.path.length ? firstIssue.path.join(".") : "input";

  return NextResponse.json(
    { error: `${field}: ${firstIssue.message}` },
    { status: 400 }
  );
}

    const {
      name, email, password,
      age, dob, gender, mobileNumber, country,
      occupation, describesYou, intention, useCase,
    } = parsed.data;

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email.toLowerCase()}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const intentionStr = Array.isArray(intention) && intention.length > 0
      ? intention.join(", ")
      : null;

    const users = await sql`
      INSERT INTO users (
        name, email, password_hash,
        age, dob, gender, mobile_number, country,
        occupation, describes_you, intention, use_case,
        onboarding_completed
      ) VALUES (
        ${name},
        ${email.toLowerCase()},
        ${passwordHash},
        ${age ?? null},
        ${dob ?? null},
        ${gender ?? null},
        ${mobileNumber ?? null},
        ${country ?? null},
        ${occupation ?? null},
        ${describesYou ?? null},
        ${intentionStr},
        ${useCase ?? null},
        false
      )
      RETURNING id, name, email, created_at
    `;

    const user = users[0];
    const token = signToken({ userId: user.id, email: user.email });

    const response = NextResponse.json(
      { message: "User registered successfully.", user },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    sendWelcomeEmail({ to: email, name }).catch((err) =>
      console.error("[register] welcome email failed:", err)
    );

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}