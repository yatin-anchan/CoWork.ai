import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sql } from "@/lib/db/neon";
import { hashPassword } from "@/lib/auth/hash";
import { signToken } from "@/lib/auth/jwt";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6),
  age: z.number().int().min(13).max(120).optional().nullable(),
  dob: z.string().optional().nullable(),
  gender: z.string().max(50).optional().nullable(),
  mobileNumber: z.string().max(30).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password. Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const {
  name,
  email,
  password,
  age,
  dob,
  gender,
  mobileNumber,
  country,
} = parsed.data;

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const users =await sql`
  INSERT INTO users (
    name,
    email,
    password_hash,
    age,
    dob,
    gender,
    mobile_number,
    country
  )
  VALUES (
    ${name},
    ${email.toLowerCase()},
    ${passwordHash},
    ${age || null},
    ${dob || null},
    ${gender || null},
    ${mobileNumber || null},
    ${country || null}
  )
  RETURNING id, name, email, age, dob, gender, mobile_number, country, created_at
`;

    const user = users[0];

    const token = signToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        message: "User registered successfully.",
        token,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 }
    );
  }
}