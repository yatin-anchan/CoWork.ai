import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/middleware";
import { sql } from "@/lib/db/neon";

export async function PATCH(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    dob?: string | null;
    gender?: string | null;
    mobileNumber?: string | null;
    country?: string | null;
    occupation?: string | null;
    describesYou?: string | null;
    intentions?: string[] | null;
    useCase?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    dob,
    gender,
    mobileNumber,
    country,
    occupation,
    describesYou,
    intentions,
    useCase,
  } = body;

  // Validate dob if provided
  if (dob) {
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) {
      return NextResponse.json({ error: "Invalid date of birth." }, { status: 400 });
    }
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    if (age < 13) {
      return NextResponse.json({ error: "Must be at least 13 years old." }, { status: 400 });
    }
    if (age > 120) {
      return NextResponse.json({ error: "Enter a valid date of birth." }, { status: 400 });
    }
  }

  // Validate gender if provided
  const allowedGenders = ["male", "female", "prefer_not_to_say"];
  if (gender && !allowedGenders.includes(gender)) {
    return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
  }

  // Validate mobile if provided
  if (mobileNumber) {
    const digitsOnly = mobileNumber.replace(/[\s+\-()]/g, "");
    if (!/^\d{6,20}$/.test(digitsOnly)) {
      return NextResponse.json({ error: "Enter a valid mobile number." }, { status: 400 });
    }
  }

  // Compute age for storage
  let ageValue: number | null = null;
  if (dob) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    ageValue = age;
  }

  await sql`
    UPDATE users SET
      dob             = ${dob ?? null},
      age             = ${ageValue},
      gender          = ${gender ?? null},
      mobile_number   = ${mobileNumber ?? null},
      country         = ${country ?? null},
      occupation      = ${occupation?.trim() ?? null},
      describes_you   = ${describesYou ?? null},
      intention       = ${intentions ? JSON.stringify(intentions) : null},
      use_case        = ${useCase?.trim() ?? null},
      updated_at      = NOW()
    WHERE id = ${user.userId}
  `;

  return NextResponse.json({ message: "Personal info updated successfully." });
}