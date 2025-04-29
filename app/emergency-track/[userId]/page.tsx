"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Phone, MessageSquare, AlertTriangle } from "lucide-react"
import LiveLocationMap from "@/components/live-location-map"

export default function EmergencyTrackPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<any>(null)
  const [emergency, setEmergency] = useState<any>(null)
  const [victimUser, setVictimUser] = useState<any>(null)
  const [location, setLocation] = useState<[number, number]>([40.7128, -74.006])

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))

    // Get emergency data
    const allEmergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
    const emergencyData = allEmergencies[userId]

    if (emergencyData) {
      setEmergency(emergencyData)
      setLocation(emergencyData.location)

      // Get victim user data
      const allUsers = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
      const victim = allUsers.find((u: any) => u.id === userId)
      if (victim) {
        setVictimUser(victim)
      }
    } else {
      // No emergency data found, redirect back
      router.push("/dashboard")
    }

    // Check for location updates
    const checkLocationUpdates = () => {
      const emergencyData = JSON.parse(localStorage.getItem("emergencyData") || "{}")
      if (emergencyData[userId]) {
        setLocation(emergencyData[userId].location)
      }
    }

    // Check immediately and then every 2 seconds
    checkLocationUpdates()
    const interval = setInterval(checkLocationUpdates, 2000)

    return () => clearInterval(interval)
  }, [router, userId])

  if (!user || !emergency || !victimUser) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-pink-700">Emergency Tracking</h1>
            <p className="text-sm text-gray-500">{victimUser.fullName}</p>
          </div>
        </div>
        <div className="bg-red-100 text-red-500 px-2 py-1 rounded-full text-xs font-medium animate-pulse">LIVE</div>
      </header>

      <div className="flex-1 space-y-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-red-500 rounded-full p-2 mt-1">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-red-700">EMERGENCY ALERT</h3>
                <p className="text-sm text-gray-700">{victimUser.fullName} needs help!</p>
                <p className="text-xs text-gray-500">{new Date(emergency.timestamp).toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-md font-medium">Live Location</h3>
          <LiveLocationMap initialLocation={location} userId={userId} height="300px" showControls={false} />
          <p className="text-xs text-gray-500 text-center">Location is being updated in real-time</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button className="bg-green-500 hover:bg-green-600 h-14">
            <Phone className="h-5 w-5 mr-2" />
            Call
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600 h-14">
            <MessageSquare className="h-5 w-5 mr-2" />
            Message
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Contact Information</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-gray-500">Phone:</span> {victimUser.phoneNumber}
              </p>
              <p>
                <span className="text-gray-500">Email:</span> {victimUser.email}
              </p>
              <p>
                <span className="text-gray-500">City:</span> {victimUser.city}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
