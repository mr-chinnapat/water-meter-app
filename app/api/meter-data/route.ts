import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const branchId = searchParams.get("branchId")
    const route = searchParams.get("route")
    const sortBy = searchParams.get("sortBy")
    const sortDirection = searchParams.get("sortDirection")
    const statusFilter = searchParams.get("status") // ✅ เพิ่ม filter status

    console.log('🔍 API Request params:', { branchId, route, sortBy, sortDirection, statusFilter })

    if (!branchId || !route) {
      return NextResponse.json({ error: "Branch ID and route are required" }, { status: 400 })
    }

    const validSortColumns = ['mtrseq', 'recorddate']
    const validDirections = ['ASC', 'DESC']
    
    const sortByValue = sortBy || 'mtrseq'
    const sortDirectionValue = sortDirection || 'ASC'
    
    const safeSortBy = validSortColumns.includes(sortByValue)
      ? sortByValue 
      : 'mtrseq'
    
    const safeDirection = validDirections.includes(sortDirectionValue.toUpperCase())
      ? sortDirectionValue.toUpperCase()
      : 'ASC'

    let orderByClause = ""

    if (safeSortBy === 'recorddate') {
      orderByClause = `ORDER BY recorddate ${safeDirection} NULLS LAST, mtrseq ASC`
    } else {
      orderByClause = `ORDER BY mtrseq ${safeDirection}`
    }

    // ✅ เพิ่ม WHERE condition สำหรับ status
    let statusCondition = ""
    if (statusFilter === "completed") {
      // แสดงเฉพาะที่นำทางเสร็จแล้ว
      statusCondition = "AND status = 'Y'"
    } else {
      // แสดงเฉพาะที่ยังไม่ได้นำทาง (default)
      statusCondition = "AND (status IS NULL OR status = '' OR status != 'Y')"
    }

    const sqlQuery = `
      SELECT 
        id, custcode, cusname, cusaddr, meterno, mtrseq,
        latitude, longitude, image_url, recorddate, status
      FROM pwamapview.routes 
      WHERE branch_id = $1
        AND mtrrdroute = $2
        AND custcode IS NOT NULL
        AND custcode != ''
        ${statusCondition}
      ${orderByClause}
    `

    console.log('📊 SQL Query:', sqlQuery)
    console.log('📊 Parameters:', [branchId, route])

    const meterDataResult = await query(sqlQuery, [branchId, route])

    console.log('✅ Results:', meterDataResult.rows.length, 'rows')

    return NextResponse.json(meterDataResult.rows)
  } catch (error) {
    console.error("Error fetching meter data:", error)
    return NextResponse.json({ error: "Failed to fetch meter data" }, { status: 500 })
  }
}