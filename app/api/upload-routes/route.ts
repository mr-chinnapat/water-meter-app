import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''))
  
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/"/g, ''))
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = cols[i] || ""
    })
    return obj
  })
}

export async function POST(request: NextRequest) {
  try {
    let data
    let branchId
    const contentType = request.headers.get("content-type") || ""
    
    if (contentType.includes("multipart/form-data")) {
      // Handle multipart form data
      const formData = await request.formData()
      const file = formData.get('file') as File
      branchId = formData.get('branchId') as string
      
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
      }
      
      if (!branchId) {
        return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
      }
      
      // ใช้ Windows-874 สำหรับภาษาไทย
      const arrayBuffer = await file.arrayBuffer()
      const decoder = new TextDecoder('windows-874')
      const fileContent = decoder.decode(arrayBuffer)
      console.log("Windows-874 content preview:", fileContent.substring(0, 200))
      
      data = parseCSV(fileContent)
      
    } else if (contentType.includes("application/json")) {
      const jsonData = await request.json()
      data = jsonData.data || jsonData
      branchId = jsonData.branchId
    } else {
      const rawBody = await request.text()
      try {
        const jsonData = JSON.parse(rawBody)
        data = jsonData.data || jsonData
        branchId = jsonData.branchId
      } catch {
        data = parseCSV(rawBody)
      }
    }
    
    console.log("Parsed CSV rows count:", data.length)
    console.log("Branch ID:", branchId)
    console.log("Sample data:", data[0])
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No valid data found" }, { status: 400 })
    }
    
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 })
    }
    
    // ลบข้อมูลเก่าของสาขานี้ก่อน
    console.log(`Deleting existing data for branch_id: ${branchId}`)
    const deleteResult = await query(
      `DELETE FROM pwamapview.routes WHERE branch_id = $1`,
      [Number.parseInt(branchId)]
    )
    console.log(`Deleted ${deleteResult.rowCount || 0} existing records`)
    
    let inserted = 0
    let skipped = 0
    let errors = []
    
    for (const row of data) {
      try {
        // Map CSV columns to database columns
        const meterbranch = (row.mtrrdroute || "").toString().trim()
        if (!meterbranch) {
          console.log("Skipping row - no mtrrdroute:", Object.keys(row))
          skipped++
          continue
        }
        
        // แก้ไข lontitude -> longitude ตาม CSV header
        const longitude = row.lontitude !== undefined && row.lontitude !== null && row.lontitude !== "" ? 
          parseFloat(row.lontitude.toString()) : null
        
        const latitude = row.latitude !== undefined && row.latitude !== null && row.latitude !== "" ? 
          parseFloat(row.latitude.toString()) : null
        
        const insertRow = [
          meterbranch,                                    // meterbranch
          meterbranch,                                    // mtrrdroute
          (row.meterno || "").toString().trim(),          // meterno
          (row.custcode || "").toString().trim(),         // custcode
          (row.recorddate || "").toString().trim(),       // recorddate
          (row.custname || "").toString().trim(),         // cusname
          (row.custaddr || "").toString().trim(),         // cusaddr
          latitude,                                       // latitude
          longitude,                                      // longitude
          (row.image_url || "").toString().trim(),        // image_url
          Number.parseInt(branchId)                       // branch_id
        ]
        
        console.log("Inserting row:", insertRow)
        
        await query(
          `INSERT INTO pwamapview.routes (meterbranch, mtrrdroute, meterno, custcode, recorddate, cusname, cusaddr, latitude, longitude, image_url, branch_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          insertRow
        )
        
        inserted++
        
      } catch (rowError) {
        console.error("Error inserting row:", rowError, "Row data:", row)
        errors.push({ row, error: String(rowError) })
      }
    }
    
    return NextResponse.json({ 
      status: "success", 
      inserted, 
      skipped,
      deleted: deleteResult.rowCount || 0,
      total: data.length,
      branchId: branchId,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      message: `สำเร็จ: ลบข้อมูลเก่า ${deleteResult.rowCount || 0} รายการ, นำเข้าใหม่ ${inserted} รายการ${skipped > 0 ? `, ข้าม ${skipped} รายการ` : ''}${errors.length > 0 ? `, ข้อผิดพลาด ${errors.length} รายการ` : ''}`
    })
    
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: String(error), 
      detail: error && typeof error === 'object' ? (error as any).stack : undefined 
    }, { status: 500 })
  }
}