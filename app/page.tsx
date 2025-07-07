"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Database, Route, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ManageDataSection from "@/components/manage-data-section"
import RouteSelectionSection from "@/components/route-selection-section"
import NavigationMeterSection from "@/components/navigation-meter-section"

export default function WaterMeterApp() {
  const [activeSection, setActiveSection] = useState<'manageData' | 'routeSelection' | 'navigationMeter'>('manageData')
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const toggleSection = (section: 'manageData' | 'routeSelection' | 'navigationMeter') => {
    setActiveSection(activeSection === section ? section : section)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-4">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="text-center mb-4">
          <h1 className="text-xl md:text-3xl font-bold text-gray-800 mb-1">ระบบนำทางอ่านมาตรน้ำ</h1>
          <p className="text-sm md:text-base text-gray-600">Water Meter Reading Navigation System</p>
        </div>

        {/* Section 1: Manage Data */}
        <Card className="shadow-lg">
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
            onClick={() => toggleSection("manageData")}
          >
            <CardTitle className="flex items-center justify-between text-base md:text-xl">
              <div className="flex items-center gap-2 md:gap-3">
                <Database className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                <span>จัดการข้อมูล (Manage Data)</span>
              </div>
              {activeSection === "manageData" ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />}
            </CardTitle>
          </CardHeader>
          {activeSection === "manageData" && (
            <CardContent className="pt-0">
              <ManageDataSection onBranchSelect={setSelectedBranch} selectedBranch={selectedBranch} />
            </CardContent>
          )}
        </Card>

        {/* Section 2: Route Selection */}
        <Card className="shadow-lg">
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
            onClick={() => toggleSection("routeSelection")}
          >
            <CardTitle className="flex items-center justify-between text-base md:text-xl">
              <div className="flex items-center gap-2 md:gap-3">
                <Route className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                <span>เลือกเส้นทาง (Route Selection)</span>
              </div>
              {activeSection === "routeSelection" ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />}
            </CardTitle>
          </CardHeader>
          {activeSection === "routeSelection" && (
            <CardContent className="pt-0">
              <RouteSelectionSection
                selectedBranch={selectedBranch}
                onRouteSelect={setSelectedRoute}
                selectedRoute={selectedRoute}
              />
            </CardContent>
          )}
        </Card>

        {/* Section 3: Navigation Meter */}
        <Card className="shadow-lg">
          <CardHeader
            className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
            onClick={() => toggleSection("navigationMeter")}
          >
            <CardTitle className="flex items-center justify-between text-base md:text-xl">
              <div className="flex items-center gap-2 md:gap-3">
                <Navigation className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                <span>นำทางมาตรน้ำ (Navigation Meter)</span>
              </div>
              {activeSection === "navigationMeter" ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />}
            </CardTitle>
          </CardHeader>
          {activeSection === "navigationMeter" && (
            <CardContent className="pt-0">
              <NavigationMeterSection selectedBranch={selectedBranch} selectedRoute={selectedRoute} />
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}