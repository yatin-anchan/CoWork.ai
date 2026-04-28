import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT NOW()`;
  console.log(result);
}

main().catch(console.error);