import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")

    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
    }

    // ใช้ branch_id โดยตรงแทนการ lookup branch_code
    const routesResult = await query(
      `SELECT mtrrdroute, COUNT(*) as count
       FROM pwamapview.routes 
       WHERE branch_id = $1
       AND mtrrdroute IS NOT NULL
       AND mtrrdroute != ''
       GROUP BY mtrrdroute
       ORDER BY mtrrdroute`,
      [branchId]
    )

    return NextResponse.json(routesResult.rows)
  } catch (error) {
    console.error("Error fetching routes:", error)
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 })
  }
}