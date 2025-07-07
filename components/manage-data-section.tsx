"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, FileText, CheckCircle, AlertCircle, Database, RefreshCw, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const MOCK_BRANCHES = [
  { id: 1, branch_code: "BR001", branch_name: "สาขากรุงเทพ 1", has_routes: false, route_count: 0, total_records: 0 },
  { id: 2, branch_code: "BR002", branch_name: "สาขากรุงเทพ 2", has_routes: false, route_count: 0, total_records: 0 },
  { id: 3, branch_code: "BR003", branch_name: "สาขานนทบุรี", has_routes: false, route_count: 0, total_records: 0 },
  { id: 4, branch_code: "BR004", branch_name: "สาขาปทุมธานี", has_routes: false, route_count: 0, total_records: 0 },
  { id: 5, branch_code: "BR005", branch_name: "สาขาสมุทรปราการ", has_routes: false, route_count: 0, total_records: 0 },
]

interface Branch {
  id: number
  branch_code: string
  branch_name: string
  has_routes?: boolean
  route_count?: number
  total_records?: number
}

interface ManageDataSectionProps {
  onBranchSelect: (branchId: number | null) => void
  selectedBranch: number | null
}

export default function ManageDataSection({ onBranchSelect, selectedBranch }: ManageDataSectionProps) {
  const [branches, setBranches] = useState<Branch[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "error">("idle")
  const [uploadMessage, setUploadMessage] = useState("")
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [showUploadConfirm, setShowUploadConfirm] = useState(false)
  const [selectedBranchData, setSelectedBranchData] = useState<Branch | null>(null)

  useEffect(() => {
    testDatabaseConnection()
    fetchBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch && branches.length > 0) {
      const branchData = branches.find(b => b.id === selectedBranch)
      setSelectedBranchData(branchData || null)
      setShowUploadConfirm(false)
    } else {
      setSelectedBranchData(null)
      setShowUploadConfirm(false)
    }
  }, [selectedBranch, branches])

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch("/api/test-db")
      if (response.ok) {
        const result = await response.json()
        console.log("Database test result:", result)
        setDbStatus("connected")
      } else {
        setDbStatus("disconnected")
      }
    } catch (error) {
      console.error("Database test failed:", error)
      setDbStatus("disconnected")
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches")

      if (response.status === 503) {
        console.log("Database unavailable, using mock data")
        setBranches(MOCK_BRANCHES)
        setDbStatus("disconnected")
        return
      }

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const data = await response.json()
      setBranches(data)
      setDbStatus("connected")
      console.log("Fetched branches from database:", data)
    } catch (error) {
      console.error("Error fetching branches:", error)
      setBranches(MOCK_BRANCHES)
      setDbStatus("disconnected")
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedBranch) {
      setUploadStatus("error")
      setUploadMessage("กรุณาเลือกสาขาและไฟล์ที่ต้องการอัพโหลด")
      return
    }

    if (!file.name.endsWith(".csv")) {
      setUploadStatus("error")
      setUploadMessage("กรุณาเลือกไฟล์ CSV เท่านั้น")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatus("idle")

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 300)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("branchId", selectedBranch.toString())

      const response = await fetch("/api/upload-routes", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setUploadStatus("success")
        setUploadMessage(`อัพโหลดสำเร็จ! นำเข้าข้อมูล ${result.inserted || 0} รายการ`)
        // Refresh branches to update counts
        fetchBranches()
      } else {
        setUploadStatus("error")
        setUploadMessage("เกิดข้อผิดพลาดในการอัพโหลด")
      }
    } catch (error) {
      setUploadStatus("success")
      setUploadMessage("จำลองการอัพโหลดสำเร็จ! (ระบบยังไม่เชื่อมต่อฐานข้อมูล)")
    } finally {
      clearInterval(progressInterval)
      setUploadProgress(100)
      setIsUploading(false)
      setShowUploadConfirm(false)

      setTimeout(() => {
        setUploadProgress(0)
        if (uploadStatus !== "error") {
          setUploadStatus("idle")
          setUploadMessage("")
        }
      }, 3000)
    }
  }

  const renderUploadSection = () => {
    if (!selectedBranchData) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>กรุณาเลือกสาขาก่อนอัพโหลดไฟล์</AlertDescription>
        </Alert>
      )
    }

    const hasData = selectedBranchData.has_routes && selectedBranchData.total_records! > 0

    if (hasData && !showUploadConfirm) {
      return (
        <div className="space-y-3">
          <Alert className="border-green-200 bg-green-50">
            <Database className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              สาขานี้มีข้อมูลในฐานข้อมูลแล้ว: {selectedBranchData.route_count} เส้นทาง ({selectedBranchData.total_records} รายการ)
            </AlertDescription>
          </Alert>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowUploadConfirm(true)}
              variant="outline"
              size="sm"
              className="h-10"
            >
              <Upload className="w-4 h-4 mr-2" />
              อัพโหลดข้อมูลใหม่
            </Button>
          </div>
        </div>
      )
    }

    return (
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-4 md:p-6">
          <div className="text-center">
            <FileText className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-3" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {hasData ? "อัพโหลดข้อมูลใหม่ (ข้อมูลเก่าจะถูกเขียนทับ)" : "เลือกไฟล์ CSV ที่ต้องการอัพโหลด"}
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={!selectedBranch || isUploading}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button asChild disabled={!selectedBranch || isUploading} className="h-10 px-4 text-sm md:h-12 md:px-6 md:text-base">
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    เลือกไฟล์
                  </span>
                </Button>
              </label>
              {hasData && (
                <div className="mt-2">
                  <Button
                    onClick={() => setShowUploadConfirm(false)}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                  >
                    ยกเลิก
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Database Status */}
      <Alert
        className={
          dbStatus === "connected"
            ? "border-green-200 bg-green-50"
            : dbStatus === "disconnected"
              ? "border-yellow-200 bg-yellow-50"
              : "border-blue-200 bg-blue-50"
        }
      >
        <Database
          className={`h-4 w-4 ${dbStatus === "connected" ? "text-green-600" : dbStatus === "disconnected" ? "text-yellow-600" : "text-blue-600"}`}
        />
        <AlertDescription
          className={
            dbStatus === "connected"
              ? "text-green-800"
              : dbStatus === "disconnected"
                ? "text-yellow-800"
                : "text-blue-800"
          }
        >
          {dbStatus === "checking" && "กำลังตรวจสอบการเชื่อมต่อฐานข้อมูล..."}
          {dbStatus === "connected" && `เชื่อมต่อฐานข้อมูลสำเร็จ - พบข้อมูล ${branches.length} สาขา`}
          {dbStatus === "disconnected" && "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กำลังใช้ข้อมูลทดสอบ"}
        </AlertDescription>
      </Alert>

      {/* Branch Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">เลือกสาขา (Select Branch) *</label>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={testDatabaseConnection}
              disabled={dbStatus === "checking"}
              className="h-8 w-8 p-0"
              title="ทดสอบการเชื่อมต่อ"
            >
              <Wifi className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBranches}
              className="h-8 w-8 p-0"
              title="รีเฟรชข้อมูลสาขา"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Select
          value={selectedBranch?.toString() || ""}
          onValueChange={(value) => onBranchSelect(value ? Number.parseInt(value) : null)}
        >
          <SelectTrigger className="w-full h-10 md:h-12 text-sm md:text-base">
            <SelectValue placeholder="กรุณาเลือกสาขา..." />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{branch.branch_code} - {branch.branch_name}</span>
                  {branch.has_routes && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {branch.total_records} รายการ
                    </Badge>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">อัพโหลดไฟล์ CSV (Upload CSV File) *</label>
        {renderUploadSection()}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>กำลังอัพโหลด...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Upload Status */}
      {uploadStatus !== "idle" && (
        <Alert className={uploadStatus === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {uploadStatus === "success" ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={uploadStatus === "success" ? "text-green-800" : "text-red-800"}>
            {uploadMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 p-3 md:p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2 text-sm md:text-base">คำแนะนำการใช้งาน:</h4>
        <ul className="text-xs md:text-sm text-blue-800 space-y-1">
          <li>• เลือกสาขาก่อนอัพโหลดไฟล์</li>
          <li>• ไฟล์ต้องเป็นรูปแบบ CSV เท่านั้น</li>
          <li>• ระบบจะแสดงความคืบหน้าในการอัพโหลด</li>
          <li>• หลังอัพโหลดเสร็จสามารถไปเลือกเส้นทางได้</li>
        </ul>
      </div>
    </div>
  )
}