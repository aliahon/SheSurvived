"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapIcon, ArrowLeft, Info } from "lucide-react"
import HeatMap from "@/components/heat-map"

export default function SafeWalkPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([30.4278, -9.5981]) // Default to Agadir

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)

    // Set location to Agadir, Morocco
    setUserLocation([30.4278, -9.5981]) // Agadir coordinates
  }, [router])

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center py-4">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-pink-700">Safety Map</h1>
      </header>

      <div className="flex-1">
        <div className="space-y-4">
          <div className="flex items-center">
            <MapIcon className="h-5 w-5 text-pink-500 mr-2" />
            <h2 className="text-lg font-medium">Incident Map</h2>
          </div>

          <Card className="bg-white border-gray-200 overflow-hidden">
            <CardContent className="p-0">
              <HeatMap center={userLocation} height="400px" zoom={14} />
            </CardContent>
          </Card>

          <Card className="bg-pink-50 border-pink-200">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-pink-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium">Safety Information</h3>
                  <p className="text-sm text-gray-500">
                    This map shows reported incidents in your area. Red markers indicate exact locations where incidents
                    have been reported. The map automatically adjusts to show daytime or nighttime incidents based on
                    your current time.
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
