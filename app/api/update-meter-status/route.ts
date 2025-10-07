import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    console.log('🔄 Updating meter status:', { id, status })

    // Update status in database
    const result = await query(
      `UPDATE pwamapview.routes 
       SET status = $1 
       WHERE id = $2`,
      [status || 'Y', id]
    )

    console.log('✅ Update result:', result.rowCount, 'rows affected')

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Status updated successfully",
      rowsAffected: result.rowCount 
    })

  } catch (error) {
    console.error("Error updating meter status:", error)
    return NextResponse.json({ 
      error: "Failed to update status",
      detail: String(error)
    }, { status: 500 })
  }
}