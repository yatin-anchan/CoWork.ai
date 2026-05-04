import { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export function getAuthUser(req: NextRequest) {
  // Read from httpOnly cookie instead of Authorization header
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    return verifyToken(token); // returns { userId, email } or throws
  } catch {
    return null;
  }
}