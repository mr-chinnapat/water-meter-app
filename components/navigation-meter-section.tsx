"use client"

import { useState, useEffect } from "react"
import { Search, Navigation, Camera, MapPin, User, Home, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import ImageCarousel from "@/components/image-carousel"

interface MeterData {
  id: number
  custcode: string
  cusname: string
  cusaddr: string
  meterno: string
  latitude: number
  longitude: number
  image_url: string
  recorddate: string
}

interface GroupedMeterData {
  meterno: string
  custcode: string
  cusname: string
  cusaddr: string
  latitude: number
  longitude: number
  recorddate: string
  images: string[]
  imageCount: number
}

interface NavigationMeterSectionProps {
  selectedBranch: number | null
  selectedRoute: string | null
}

export default function NavigationMeterSection({ selectedBranch, selectedRoute }: NavigationMeterSectionProps) {
  const [meterData, setMeterData] = useState<MeterData[]>([])
  const [filteredData, setFilteredData] = useState<GroupedMeterData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showImageCarousel, setShowImageCarousel] = useState(false)

  useEffect(() => {
    if (selectedBranch && selectedRoute) {
      fetchMeterData()
    } else {
      setMeterData([])
      setFilteredData([])
    }
  }, [selectedBranch, selectedRoute])

  useEffect(() => {
    groupAndFilterData()
  }, [searchTerm, meterData])

  const fetchMeterData = async () => {
    if (!selectedBranch || !selectedRoute) return

    setLoading(true)
    try {
      const response = await fetch(`/api/meter-data?branchId=${selectedBranch}&route=${selectedRoute}`)
      if (response.ok) {
        const data = await response.json()
        setMeterData(data)
      } else if (response.status === 503) {
        // Mock data for testing when DB is unavailable
        const mockData = [
          {
            id: 1,
            custcode: "11280012913",
            cusname: "นางพีรี ขันพท",
            cusaddr: "123 ม.7 ต.กงพะเนียง ด.เขมราฐ อ.เขมราฐ จ.อุบลราชธานี34170",
            meterno: "652228068465LY",
            latitude: 16.04314982,
            longitude: 105.22147650,
            image_url: "https://pwa-images-v2.siamrajathanee.dev/1128001291341510_1.jpg",
            recorddate: "41:51.0",
          },
          {
            id: 2,
            custcode: "11280012913",
            cusname: "นางพีรี ขันพท",
            cusaddr: "123 ม.7 ต.กงพะเนียง ด.เขมราฐ อ.เขมราฐ จ.อุบลราชธานี34170",
            meterno: "652228068465LY",
            latitude: 16.04314982,
            longitude: 105.22147650,
            image_url: "https://pwa-images-v2.siamrajathanee.dev/1128001291341510_2.jpg",
            recorddate: "41:51.0",
          },
          {
            id: 3,
            custcode: "11280012913",
            cusname: "นางพีรี ขันพท",
            cusaddr: "123 ม.7 ต.กงพะเนียง ด.เขมราฐ อ.เขมราฐ จ.อุบลราชธานี34170",
            meterno: "652228068465LY",
            latitude: 16.04314982,
            longitude: 105.22147650,
            image_url: "https://pwa-images-v2.siamrajathanee.dev/1128001291341510_3.jpg",
            recorddate: "41:51.0",
          },
        ]
        setMeterData(mockData)
      }
    } catch (error) {
      console.error("Error fetching meter data:", error)
      // Mock data for testing
      const mockData = [
        {
          id: 1,
          custcode: "11280012913",
          cusname: "นางพีรี ขันพท",
          cusaddr: "123 ม.7 ต.กงพะเนียง ด.เขมราฐ อ.เขมราฐ จ.อุบลราชธานี34170",
          meterno: "652228068465LY",
          latitude: 16.04314982,
          longitude: 105.22147650,
          image_url: "https://pwa-images-v2.siamrajathanee.dev/1128001291341510_1.jpg",
          recorddate: "41:51.0",
        },
      ]
      setMeterData(mockData)
    } finally {
      setLoading(false)
    }
  }

  const groupAndFilterData = () => {
    // Group by meter number and combine all images
    const groupedByMeter = meterData.reduce((acc, item) => {
      const key = item.meterno
      if (!acc[key]) {
        acc[key] = {
          meterno: item.meterno,
          custcode: item.custcode,
          cusname: item.cusname,
          cusaddr: item.cusaddr,
          latitude: item.latitude,
          longitude: item.longitude,
          recorddate: item.recorddate,
          images: [],
          imageCount: 0
        }
      }
      
      // Add image URL if exists
      if (item.image_url && item.image_url.trim()) {
        // Split comma-separated URLs and add each one
        const urls = item.image_url.split(',').map(url => url.trim()).filter(url => url)
        acc[key].images.push(...urls)
      }
      
      return acc
    }, {} as Record<string, GroupedMeterData>)

    // Convert to array and update image count
    let groupedArray = Object.values(groupedByMeter).map(meter => ({
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
          item.custcode.toString().includes(searchTerm)
      )
    }

    setFilteredData(groupedArray)
  }

  const handleNavigation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
    window.open(url, "_blank")
  }

  const handleViewImages = (images: string[]) => {
    setSelectedImages(images)
    setShowImageCarousel(true)
  }

  if (!selectedBranch || !selectedRoute) {
    return (
      <Alert>
        <Navigation className="h-4 w-4" />
        <AlertDescription>กรุณาเลือกสาขาและเส้นทางในส่วนก่อนหน้าก่อน</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">ค้นหาข้อมูล</label>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchMeterData} 
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm md:text-base font-medium">เส้นทาง {selectedRoute}</h3>
        {filteredData.length > 0 && (
          <div className="text-xs text-gray-600">
            {filteredData.length} มาตร ({filteredData.reduce((total, meter) => total + meter.imageCount, 0)} รูป)
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-6">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">กำลังโหลดข้อมูลมาตรน้ำ...</p>
        </div>
      ) : filteredData.length > 0 ? (
        <div className="space-y-3">
          {filteredData.map((meter) => (
            <Card key={meter.meterno} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                {/* Customer Info - Compact */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-sm md:text-base truncate">{meter.cusname}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {meter.custcode}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600 mb-2">
                      <Home className="w-3 h-3 mt-1 flex-shrink-0" />
                      <span className="text-xs md:text-sm line-clamp-2">{meter.cusaddr}</span>
                    </div>
                  </div>
                </div>

                {/* Meter Info - More Compact */}
                <div className="bg-gray-50 p-2 md:p-3 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span className="font-medium text-xs md:text-sm truncate">{meter.meterno}</span>
                        <Badge variant="secondary" size="sm" className="text-xs px-1 py-0">
                          {meter.recorddate}
                        </Badge>
                        {meter.imageCount > 0 && (
                          <Badge variant="outline" size="sm" className="text-xs px-1 py-0">
                            {meter.imageCount} รูป
                          </Badge>
                        )}
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
          ))}
        </div>
      ) : (
        <Alert>
          <Search className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {searchTerm ? "ไม่พบข้อมูลที่ตรงกับการค้นหา" : "ไม่พบข้อมูลมาตรน้ำสำหรับเส้นทางนี้"}
          </AlertDescription>
        </Alert>
      )}

      {/* Image Carousel Modal */}
      <ImageCarousel images={selectedImages} isOpen={showImageCarousel} onClose={() => setShowImageCarousel(false)} />
    </div>
  )
}