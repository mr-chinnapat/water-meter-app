import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"

export async function GET() {
  try {
    const sql = getSql()

    // Test the connection and check if tables exist
    const tablesCheck = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'pwamapview' 
      AND table_name IN ('branches', 'routes')
    `

    const branchCount = await sql`
      SELECT COUNT(*) as count FROM pwamapview.branches
    `

    const routeCount = await sql`
      SELECT COUNT(*) as count FROM pwamapview.routes
    `

    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      tables: tablesCheck,
      branchCount: branchCount[0]?.count || 0,
      routeCount: routeCount[0]?.count || 0,
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
