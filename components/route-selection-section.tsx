"use client"

import { useState, useEffect } from "react"
import { Route, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface RouteInfo {
  mtrrdroute: string
  count: number
}

interface RouteSelectionSectionProps {
  selectedBranch: number | null
  onRouteSelect: (route: string | null) => void
  selectedRoute: string | null
}

export default function RouteSelectionSection({
  selectedBranch,
  onRouteSelect,
  selectedRoute,
}: RouteSelectionSectionProps) {
  const [routes, setRoutes] = useState<RouteInfo[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedBranch) {
      fetchRoutes()
    } else {
      setRoutes([])
      onRouteSelect(null)
    }
  }, [selectedBranch])

  const fetchRoutes = async () => {
    if (!selectedBranch) return

    setLoading(true)
    try {
      const response = await fetch(`/api/routes?branchId=${selectedBranch}`)
      if (response.ok) {
        const data = await response.json()
        setRoutes(data)
      } else {
        // Mock data for testing
        setRoutes([
          { mtrrdroute: "40001", count: 25 },
          { mtrrdroute: "40002", count: 30 },
          { mtrrdroute: "40003", count: 22 },
          { mtrrdroute: "40004", count: 28 },
        ])
      }
    } catch (error) {
      console.error("Error fetching routes:", error)
      // Mock data for testing
      setRoutes([
        { mtrrdroute: "40001", count: 25 },
        { mtrrdroute: "40002", count: 30 },
        { mtrrdroute: "40003", count: 22 },
        { mtrrdroute: "40004", count: 28 },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!selectedBranch) {
    return (
      <Alert>
        <Route className="h-4 w-4" />
        <AlertDescription>กรุณาเลือกสาขาและอัพโหลดข้อมูลในส่วน "จัดการข้อมูล" ก่อน</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base md:text-lg font-medium">เลือกเส้นทางที่ต้องการแสดงผล</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchRoutes} 
          disabled={loading}
          className="h-8 w-8 p-0"
          title="รีเฟรช"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">กำลังโหลดข้อมูลเส้นทาง...</p>
        </div>
      ) : routes.length > 0 ? (
        <div className="space-y-3">
          <Select value={selectedRoute || ""} onValueChange={(value) => onRouteSelect(value || null)}>
            <SelectTrigger className="w-full h-10 md:h-12 text-sm md:text-base">
              <SelectValue placeholder="กรุณาเลือกเส้นทาง..." />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.mtrrdroute} value={route.mtrrdroute}>
                  <div className="flex items-center justify-between w-full">
                    <span>เส้นทาง {route.mtrrdroute}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {route.count} จุด
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedRoute && (
            <Alert className="border-green-200 bg-green-50">
              <Route className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 text-sm">
                เลือกเส้นทาง {selectedRoute} แล้ว - สามารถไปส่วน "นำทางมาตรน้ำ" เพื่อดูรายละเอียดได้
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-gray-600">
            พบ {routes.length} เส้นทาง รวม {routes.reduce((total, route) => total + route.count, 0)} จุดอ่าน
          </div>
        </div>
      ) : (
        <Alert>
          <Route className="h-4 w-4" />
          <AlertDescription>ไม่พบข้อมูลเส้นทางสำหรับสาขานี้ กรุณาอัพโหลดข้อมูลก่อน</AlertDescription>
        </Alert>
      )}
    </div>
  )
}