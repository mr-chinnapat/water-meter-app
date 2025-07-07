import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const route = searchParams.get("route")

    if (!branchId || !route) {
      return NextResponse.json({ error: "Branch ID and route are required" }, { status: 400 })
    }

    // ใช้ branch_id โดยตรงแทนการ lookup branch_code
    const meterDataResult = await query(
      `SELECT 
        id, custcode, cusname, cusaddr, meterno, 
        latitude, longitude, image_url, recorddate
      FROM pwamapview.routes 
      WHERE branch_id = $1
      AND mtrrdroute = $2
      AND custcode IS NOT NULL
      AND custcode != ''
      ORDER BY custcode, meterno`,
      [branchId, route]
    )

    return NextResponse.json(meterDataResult.rows)
  } catch (error) {
    console.error("Error fetching meter data:", error)
    return NextResponse.json({ error: "Failed to fetch meter data" }, { status: 500 })
  }
}