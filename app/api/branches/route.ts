import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(
      `SELECT 
        b.id, 
        b.branch_code, 
        b.branch_name,
        CASE 
          WHEN r.route_count > 0 THEN true 
          ELSE false 
        END as has_routes,
        COALESCE(r.route_count, 0) as route_count,
        COALESCE(r.total_records, 0) as total_records
      FROM pwamapview.branches b
      LEFT JOIN (
        SELECT 
          branch_id,
          COUNT(DISTINCT mtrrdroute) as route_count,
          COUNT(*) as total_records
        FROM pwamapview.routes 
        WHERE mtrrdroute IS NOT NULL 
        AND mtrrdroute != ''
        GROUP BY branch_id
      ) r ON b.id = r.branch_id
      ORDER BY b.branch_code`
    )
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching branches:", error)
    return NextResponse.json({ error: "Error fetching branches" }, { status: 500 })
  }
}