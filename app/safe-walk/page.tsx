"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapIcon, ArrowLeft, Navigation, Info } from "lucide-react"
import HeatMap from "@/components/heat-map"

export default function SafeWalkPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.006]) // Default to NYC

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)

    // Use default location instead of trying to get actual location
    // This avoids the geolocation permission error in restricted environments
    const defaultLocations = {
      "New York": [40.7128, -74.006],
      "Los Angeles": [34.0522, -118.2437],
      Chicago: [41.8781, -87.6298],
      "San Francisco": [37.7749, -122.4194],
      Miami: [25.7617, -80.1918],
    }

    // Select a random city from the defaults
    const cities = Object.keys(defaultLocations)
    const randomCity = cities[Math.floor(Math.random() * cities.length)]
    setUserLocation(defaultLocations[randomCity as keyof typeof defaultLocations])
  }, [router])

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center py-4">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-pink-700">Safe Walk Routes</h1>
      </header>

      <div className="flex-1">
        <div className="space-y-4">
          <div className="flex items-center">
            <MapIcon className="h-5 w-5 text-pink-500 mr-2" />
            <h2 className="text-lg font-medium">Heat Map & Safe Routes</h2>
          </div>

          <Card className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              <HeatMap center={userLocation} height="300px" zoom={14} />
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-md font-medium">Recommended Safe Routes</h3>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-green-700">Main Street Route</h3>
                    <p className="text-sm text-gray-500">Well-lit, high traffic area</p>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-yellow-700">Park Avenue</h3>
                    <p className="text-sm text-gray-500">Moderate safety, some lighting</p>
                  </div>
                  <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600">
                    <Navigation className="h-4 w-4 mr-1" />
                    Navigate
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-pink-50 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Safety Information</h3>
                  <p className="text-sm text-gray-500">
                    This heat map is generated based on incident reports and community feedback. Green areas are
                    considered safer, while red areas have had more reported incidents.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
