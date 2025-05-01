"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  AlertTriangle,
  History,
  Mic,
  Radio,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import LiveLocationMap from "@/components/live-location-map"
import AudioPlayer from "@/components/audio-player"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function EmergencyTrackPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [user, setUser] = useState<any>(null)
  const [emergency, setEmergency] = useState<any>(null)
  const [victimUser, setVictimUser] = useState<any>(null)
  const [location, setLocation] = useState<[number, number]>([30.4278, -9.5981])
  const [mapReady, setMapReady] = useState(false)
  const [audioChunks, setAudioChunks] = useState<string[]>([])
  const [liveStreamActive, setLiveStreamActive] = useState(false)
  const [latestAudioChunk, setLatestAudioChunk] = useState<any>(null)
  const liveStreamCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))

    // Get emergency data
    const loadEmergencyData = () => {
      const allEmergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
      const emergencyData = allEmergencies[userId]

      if (emergencyData) {
        setEmergency(emergencyData)
        setLocation(emergencyData.location)
        setLiveStreamActive(emergencyData.liveStreamActive || false)

        // Get audio chunks if available
        if (emergencyData.audioChunks && Array.isArray(emergencyData.audioChunks)) {
          setAudioChunks(emergencyData.audioChunks)
        }

        // Get latest audio chunk for live streaming
        if (emergencyData.latestAudioChunk) {
          setLatestAudioChunk(emergencyData.latestAudioChunk)
        }

        // Get victim user data
        const allUsers = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
        const victim = allUsers.find((u: any) => u.id === userId)
        if (victim) {
          setVictimUser(victim)
        }
      } else {
        // Check emergency history
        const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}")
        if (emergencyHistory[userId]) {
          // Get all alerts for this user
          const userAlerts = Array.isArray(emergencyHistory[userId])
            ? emergencyHistory[userId]
            : [emergencyHistory[userId]]

          // Get the most recent alert
          const mostRecentAlert = userAlerts[userAlerts.length - 1]

          setEmergency(mostRecentAlert)
          setLocation(mostRecentAlert.location)
          setLiveStreamActive(mostRecentAlert.liveStreamActive || false)

          // Get audio chunks if available
          if (mostRecentAlert.audioChunks && Array.isArray(mostRecentAlert.audioChunks)) {
            setAudioChunks(mostRecentAlert.audioChunks)
          }

          // Get latest audio chunk for live streaming
          if (mostRecentAlert.latestAudioChunk) {
            setLatestAudioChunk(mostRecentAlert.latestAudioChunk)
          }

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
      }
    }

    loadEmergencyData()

    // Check for location updates
    const checkLocationUpdates = () => {
      const emergencyData = JSON.parse(localStorage.getItem("emergencyData") || "{}")
      if (emergencyData[userId]) {
        setLocation(emergencyData[userId].location)
      }
    }

    // Check immediately and then every 2 seconds
    checkLocationUpdates()
    const locationInterval = setInterval(checkLocationUpdates, 2000)

    // Set up event listener for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emergencies" || e.key === "emergencyHistory" || e.key === "emergencyData") {
        loadEmergencyData()
        checkLocationUpdates()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Set up interval to check for live audio updates
    liveStreamCheckIntervalRef.current = setInterval(() => {
      if (liveStreamActive) {
        const allEmergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
        const emergencyData = allEmergencies[userId]

        if (emergencyData && emergencyData.latestAudioChunk) {
          setLatestAudioChunk(emergencyData.latestAudioChunk)

          // Update audio chunks if needed
          if (emergencyData.audioChunks && Array.isArray(emergencyData.audioChunks)) {
            setAudioChunks(emergencyData.audioChunks)
          }
        }
      }
    }, 2000)

    // Set map ready after a delay to ensure DOM is ready
    const mapReadyTimeout = setTimeout(() => {
      setMapReady(true)
    }, 1000)

    return () => {
      clearInterval(locationInterval)
      clearTimeout(mapReadyTimeout)
      if (liveStreamCheckIntervalRef.current) {
        clearInterval(liveStreamCheckIntervalRef.current)
      }
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, userId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const handleSeek = (chunkIndex: number) => {
    console.log(`Seeking to chunk ${chunkIndex}`)
    // In a real app, this would seek to the specific audio chunk
  }

  if (!user || !emergency || !victimUser) return null

  const isDoubtMode = emergency.doubtMode === true

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
        <div
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            emergency.active
              ? isDoubtMode
                ? "bg-yellow-100 text-yellow-500 animate-pulse"
                : "bg-red-100 text-red-500 animate-pulse"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {emergency.active ? (isDoubtMode ? "DOUBT" : "LIVE") : "INACTIVE"}
        </div>
      </header>

      <div className="flex-1 space-y-4">
        <Card
          className={
            emergency.active
              ? isDoubtMode
                ? "bg-yellow-50 border-yellow-200"
                : "bg-red-50 border-red-200"
              : "bg-gray-50 border-gray-200"
          }
        >
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <div
                className={`rounded-full p-2 mt-1 ${
                  emergency.active ? (isDoubtMode ? "bg-yellow-500" : "bg-red-500") : "bg-gray-500"
                }`}
              >
                {isDoubtMode ? (
                  <AlertCircle className="h-4 w-4 text-white" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <h3
                  className={`font-bold ${
                    emergency.active ? (isDoubtMode ? "text-yellow-700" : "text-red-700") : "text-gray-700"
                  }`}
                >
                  {emergency.active ? (isDoubtMode ? "DOUBT SITUATION" : "EMERGENCY ALERT") : "PAST EMERGENCY"}
                </h3>
                <p className="text-sm text-gray-700">
                  {isDoubtMode
                    ? `${victimUser.fullName} reported a suspicious situation`
                    : `${victimUser.fullName} ${emergency.active ? "needs help!" : "needed help"}`}
                </p>
                <p className="text-xs text-gray-500">{formatDate(emergency.timestamp)}</p>
                {emergency.cancelledAt && (
                  <div className="mt-1">
                    <p className="text-xs text-yellow-600">Cancelled at {formatDate(emergency.cancelledAt)}</p>
                    {emergency.cancellationReason && (
                      <div className="flex items-center mt-1">
                        {emergency.wasRealEmergency ? (
                          <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        )}
                        <p className="text-xs font-medium">{emergency.cancellationReason}</p>
                      </div>
                    )}
                    {emergency.emergencyType && (
                      <div className="mt-1 bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full inline-block">
                        {emergency.emergencyType}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <h3 className="text-md font-medium">{emergency.active ? "Live Location" : "Last Known Location"}</h3>
          {!mapReady ? (
            <Skeleton className="w-full h-[300px] rounded-md" />
          ) : (
            <LiveLocationMap initialLocation={location} userId={userId} height="300px" showControls={false} />
          )}
          <p className="text-xs text-gray-500 text-center">
            {emergency.active ? "Location is being updated in real-time" : "This was the last recorded location"}
          </p>
        </div>

        {audioChunks.length > 0 && (
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Mic className="h-5 w-5 text-pink-500" />
                  <h3 className="font-medium">Audio Recording</h3>
                </div>
                {liveStreamActive && (
                  <div className="flex items-center space-x-1">
                    <Radio className="h-3 w-3 text-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 font-medium">Live</span>
                  </div>
                )}
              </div>

              <AudioPlayer
                audioChunks={audioChunks}
                isLive={liveStreamActive}
                latestTimestamp={latestAudioChunk?.timestamp}
                onSeek={handleSeek}
              />
            </CardContent>
          </Card>
        )}

        {emergency.active && (
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
        )}

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

        <Link href="/emergency-history">
          <Button variant="outline" className="w-full border-pink-200 text-pink-700">
            <History className="h-4 w-4 mr-2" />
            View All Emergency History
          </Button>
        </Link>
      </div>
    </div>
  )
}
