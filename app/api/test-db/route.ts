import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query("SELECT 1 as test")
    const branchCount = await query("SELECT COUNT(*) as count FROM branches")

    return NextResponse.json({
      test: result.rows[0].test,
      branchCount: branchCount.rows[0].count,
    })
  } catch (error) {
    return NextResponse.json({ error: "Database test error" }, { status: 500 })
  }
}
