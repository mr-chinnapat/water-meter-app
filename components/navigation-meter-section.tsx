"use client"

import { useState, useEffect } from "react"
import { Search, Navigation, Camera, MapPin, User, Home, RefreshCw, Clock, ArrowDownWideNarrow, ArrowUpWideNarrow, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox" // ✅ เพิ่ม Checkbox
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // ✅ เพิ่ม Tabs
import ImageCarousel from "@/components/image-carousel"
import { format, parseISO, isValid } from "date-fns"

interface MeterData {
  id: number
  custcode: string
  cusname: string
  cusaddr: string
  meterno: string
  mtrseq: number | null
  latitude: number
  longitude: number
  image_url: string
  recorddate: string
  status: string | null
}

interface GroupedMeterData {
  id: number // ✅ เพิ่ม id
  meterno: string
  mtrseq: number | null
  custcode: string
  cusname: string
  cusaddr: string
  latitude: number
  longitude: number
  recorddate: string
  status: string | null
  images: string[]
  imageCount: number
}

interface NavigationMeterSectionProps {
  selectedBranch: number | null
  selectedRoute: string | null
}

type SortBy = 'mtrseq' | 'recorddate'
type SortDirection = 'ASC' | 'DESC'
type StatusFilter = 'pending' | 'completed' // ✅ เพิ่ม status filter type

const formatRecordDate = (dateString: string) => {
    if (!dateString) return "N/A"
    
    try {
      const date = parseISO(dateString.trim())
      
      if (isValid(date)) {
        return format(date, 'yyyy-MM-dd HH:mm:ss')
      }
    } catch (error) {
      console.warn('Invalid date:', dateString)
    }
    
    return dateString.trim() || "N/A"
}

export default function NavigationMeterSection({ selectedBranch, selectedRoute }: NavigationMeterSectionProps) {
  const [meterData, setMeterData] = useState<MeterData[]>([])
  const [filteredData, setFilteredData] = useState<GroupedMeterData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showImageCarousel, setShowImageCarousel] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>('mtrseq')
  const [sortDirection, setSortDirection] = useState<SortDirection>('ASC')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending') // ✅ เพิ่ม status filter
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null) // ✅ เพื่อแสดง loading ตอน update

  // Fetch data
  useEffect(() => {
    if (!selectedBranch || !selectedRoute) {
      setMeterData([])
      setFilteredData([])
      return
    }

    const fetchMeterData = async () => {
      setLoading(true)
      try {
        // ✅ เพิ่ม status parameter
        const url = `/api/meter-data?branchId=${selectedBranch}&route=${selectedRoute}&sortBy=${sortBy}&sortDirection=${sortDirection}&status=${statusFilter}`
        
        console.log('🔍 Fetching with params:', { selectedBranch, selectedRoute, sortBy, sortDirection, statusFilter })
        
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Data received:', data.length, 'records')
          setMeterData(data)
        } else {
          console.error('❌ API Error:', response.status)
          setMeterData([])
        }
      } catch (error) {
        console.error("Error fetching meter data:", error)
        setMeterData([])
      } finally {
        setLoading(false)
      }
    }

    fetchMeterData()
  }, [selectedBranch, selectedRoute, sortBy, sortDirection, statusFilter]) // ✅ เพิ่ม statusFilter

  // Group and filter data
  useEffect(() => {
    const groupedMap = new Map<string, GroupedMeterData>()
    
    meterData.forEach((item) => {
      const key = item.meterno
      
      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          id: item.id, // ✅ เพิ่ม id
          meterno: item.meterno,
          mtrseq: item.mtrseq,
          custcode: item.custcode,
          cusname: item.cusname,
          cusaddr: item.cusaddr,
          latitude: item.latitude,
          longitude: item.longitude,
          recorddate: item.recorddate,
          status: item.status,
          images: [],
          imageCount: 0
        })
      }
      
      const group = groupedMap.get(key)!
      if (item.image_url && item.image_url.trim()) {
        const urls = item.image_url.split(',').map(url => url.trim()).filter(url => url)
        group.images.push(...urls)
      }
    })

    let groupedArray = Array.from(groupedMap.values()).map(meter => ({
      ...meter,
      imageCount: meter.images.length
    }))

    // Apply search filter
    if (searchTerm) {
      groupedArray = groupedArray.filter(
        (item) =>
          item.meterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.cusname.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.cusaddr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.custcode.toString().includes(searchTerm) ||
          (item.mtrseq && item.mtrseq.toString().includes(searchTerm))
      )
    }

    setFilteredData(groupedArray)
  }, [meterData, searchTerm])

  // ✅ ฟังก์ชัน Update Status
  const handleStatusUpdate = async (id: number, checked: boolean) => {
    if (!checked) return // ถ้า uncheck ไม่ทำอะไร

    setUpdatingStatus(id)
    
    try {
      console.log('🔄 Updating status for ID:', id)
      
      const response = await fetch('/api/update-meter-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: id,
          status: 'Y'
        })
      })

      if (response.ok) {
        console.log('✅ Status updated successfully')
        
        // ลบรายการนี้ออกจาก UI ทันที
        setFilteredData(prev => prev.filter(item => item.id !== id))
        setMeterData(prev => prev.filter(item => item.id !== id))
        
        // แสดง toast หรือ notification (optional)
        // toast.success('นำทางเสร็จแล้ว')
      } else {
        console.error('❌ Failed to update status')
        alert('เกิดข้อผิดพลาดในการอัปเดต')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleNavigation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, "_blank")
  }

  const handleViewImages = (images: string[]) => {
    setSelectedImages(images)
    setShowImageCarousel(true)
  }
  
  const handleSortByChange = (value: string) => {
    console.log('📊 Sort by changed to:', value)
    setSortBy(value as SortBy)
  }

  const handleSortDirectionChange = (value: string) => {
    console.log('📊 Sort direction changed to:', value)
    setSortDirection(value as SortDirection)
  }

  // ✅ ฟังก์ชันเปลี่ยน Tab
  const handleTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter)
    setSearchTerm("") // Clear search เมื่อเปลี่ยน tab
  }

  if (!selectedBranch || !selectedRoute) {
    return (
      <Alert>
        <Navigation className="h-4 w-4" />
        <AlertDescription>กรุณาเลือกสาขาและเส้นทางในส่วนก่อนหน้าก่อน</AlertDescription>
      </Alert>
    )
  }

  // ✅ Render Card Component (แยกออกมาเพื่อใช้ซ้ำ)
  const renderMeterCard = (meter: GroupedMeterData) => (
    <Card key={`${meter.meterno}-${meter.id}`} className="shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-3 md:p-4">
        
        {/* Customer Info */}
        <div className="flex flex-col gap-2 mb-3">
          
          {/* Row 1: Customer Name and Code */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="font-medium text-sm md:text-base truncate">{meter.cusname}</span>
              <Badge variant="outline" className="text-xs px-1 py-0">
                {meter.custcode}
              </Badge>
              {meter.status === 'Y' && (
                <Badge variant="secondary" className="text-xs px-1 py-0 bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  เสร็จแล้ว
                </Badge>
              )}
            </div>
            
            {/* ✅ Checkbox สำหรับนำทางเสร็จแล้ว (แสดงเฉพาะ tab pending) */}
            {statusFilter === 'pending' && (
              <div className="flex items-center space-x-2 ml-2">
                <Checkbox 
                  id={`complete-${meter.id}`}
                  checked={updatingStatus === meter.id}
                  onCheckedChange={(checked) => handleStatusUpdate(meter.id, checked as boolean)}
                  disabled={updatingStatus === meter.id}
                />
                <Label 
                  htmlFor={`complete-${meter.id}`}
                  className="text-xs cursor-pointer whitespace-nowrap"
                >
                  นำทางเสร็จแล้ว
                </Label>
              </div>
            )}
          </div>
          
          {/* Row 2: Customer Address */}
          <div className="flex items-start gap-2 text-gray-600">
            <Home className="w-3 h-3 mt-1 flex-shrink-0" />
            <span className="text-xs md:text-sm line-clamp-2">{meter.cusaddr}</span>
          </div>
          
          {/* Row 3: Meter Info */}
          <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t mt-2">
            <div className="flex items-center gap-1 font-semibold text-purple-600">
              <RefreshCw className="w-3 h-3" />
              <span>Seq: {meter.mtrseq !== null ? meter.mtrseq : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500">
              <span>Meter: {meter.meterno}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold text-green-600">
              <Clock className="w-3 h-3" />
              <span>Time: {formatRecordDate(meter.recorddate)}</span>
            </div>
            {meter.imageCount > 0 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                {meter.imageCount} รูป
              </Badge>
            )}
          </div>
        </div>

        {/* Meter Info - Location/Actions */}
        <div className="bg-gray-50 p-2 md:p-3 rounded">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span className="font-medium text-xs md:text-sm truncate">พิกัด GPS</span>
              </div>
              <div className="text-xs text-gray-600">
                {meter.latitude}, {meter.longitude}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              <Button
                onClick={() => handleNavigation(meter.latitude, meter.longitude)}
                className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-xs"
                size="sm"
              >
                <Navigation className="w-3 h-3 mr-1" />
                นำทาง
              </Button>

              {meter.images.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => handleViewImages(meter.images)}
                  className="h-8 px-3 text-xs"
                  size="sm"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  รูป ({meter.imageCount})
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* ✅ Tabs สำหรับสลับระหว่าง Pending และ Completed */}
      <Tabs value={statusFilter} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            <Navigation className="w-4 h-4 mr-2" />
            นำทางมาตรน้ำ
          </TabsTrigger>
          <TabsTrigger value="completed">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            นำทางเสร็จแล้ว
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="space-y-4 mt-4">
          {/* Search and Sort Section */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Search */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">ค้นหาข้อมูล</label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setMeterData([])
                    setSortBy(prev => prev)
                  }}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                  title="รีเฟรช"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="ค้นหาด้วยเลขมาตร, ชื่อ, ที่อยู่..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 text-sm"
                />
              </div>
            </div>
            
            {/* Sort Group */}
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <Label htmlFor="sort-options" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  เรียงลำดับโดย
                </Label>
                <RadioGroup 
                  id="sort-options"
                  value={sortBy} 
                  onValueChange={handleSortByChange} 
                  className="flex items-center justify-start space-y-0"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mtrseq" id="sort-seq" />
                    <Label htmlFor="sort-seq" className="text-sm cursor-pointer">
                      ตามลำดับ (Seq)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="recorddate" id="sort-time" />
                    <Label htmlFor="sort-time" className="text-sm cursor-pointer">
                      ตามเวลา (Time)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                <Label htmlFor="sort-direction" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  ทิศทางการเรียง
                </Label>
                <RadioGroup 
                  id="sort-direction"
                  value={sortDirection} 
                  onValueChange={handleSortDirectionChange} 
                  className="flex items-center justify-start space-y-0"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ASC" id="sort-asc" />
                    <Label htmlFor="sort-asc" className="flex items-center text-sm cursor-pointer">
                      <ArrowUpWideNarrow className="w-3 h-3 mr-1" />
                      น้อยไปมาก (ASC)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <RadioGroupItem value="DESC" id="sort-desc" />
                    <Label htmlFor="sort-desc" className="flex items-center text-sm cursor-pointer">
                      <ArrowDownWideNarrow className="w-3 h-3 mr-1" />
                      มากไปน้อย (DESC)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-medium">
              เส้นทาง {selectedRoute}
              {statusFilter === 'completed' && (
                <Badge variant="secondary" className="ml-2">เสร็จแล้ว</Badge>
              )}
            </h3>
            {filteredData.length > 0 && (
              <div className="text-xs text-gray-600">
                {filteredData.length} มาตร ({filteredData.reduce((total, meter) => total + meter.imageCount, 0)} รูป)
              </div>
            )}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-6">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">กำลังโหลดข้อมูลมาตรน้ำ...</p>
            </div>
          ) : filteredData.length > 0 ? (
            <div className="space-y-3">
              {filteredData.map(meter => renderMeterCard(meter))}
            </div>
          ) : (
            <Alert>
              <Search className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {searchTerm 
                  ? "ไม่พบข้อมูลที่ตรงกับการค้นหา" 
                  : statusFilter === 'completed'
                    ? "ยังไม่มีรายการที่นำทางเสร็จแล้ว"
                    : "ไม่พบข้อมูลมาตรน้ำสำหรับเส้นทางนี้"
                }
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      <ImageCarousel images={selectedImages} isOpen={showImageCarousel} onClose={() => setShowImageCarousel(false)} />
    </div>
  )
}