"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, X, Mic, ArrowLeft, Bell, Users } from "lucide-react"
import LiveLocationMap from "@/components/live-location-map"
import { Skeleton } from "@/components/ui/skeleton"

export default function AlarmPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [alarmActive, setAlarmActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [location, setLocation] = useState<[number, number]>([30.4278, -9.5981]) // Default to Agadir
  const [elapsedTime, setElapsedTime] = useState(0)
  const [trustedContacts, setTrustedContacts] = useState<any[]>([])
  const [mapReady, setMapReady] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)

    // Check if user has bracelet and it's verified
    if (!userData.hasBracelet) {
      router.push("/dashboard")
      return
    }

    if (!userData.braceletVerified) {
      router.push("/bracelet-verification")
      return
    }

    setUser(userData)

    // Get trusted contacts
    const allUsers = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
    const userTrustedContacts = userData.trustedContacts || []
    const contacts = allUsers.filter((u: any) => userTrustedContacts.includes(u.id))
    setTrustedContacts(contacts)

    // Generate random location (in a real app, this would use actual GPS)
    const randomLat = 30.4278 + (Math.random() - 0.5) * 0.01
    const randomLng = -9.5981 + (Math.random() - 0.5) * 0.01
    setLocation([randomLat, randomLng])

    // Check if there's an active emergency for this user
    const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
    if (emergencies[userData.id] && emergencies[userData.id].active) {
      setAlarmActive(true)
      setRecording(true)

      // Calculate elapsed time
      const startTime = new Date(emergencies[userData.id].timestamp).getTime()
      const currentTime = new Date().getTime()
      const elapsed = Math.floor((currentTime - startTime) / 1000)
      setElapsedTime(elapsed)

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    // Set up event listener for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emergencies") {
        const updatedEmergencies = JSON.parse(e.newValue || "{}")
        if (updatedEmergencies[userData.id]) {
          if (updatedEmergencies[userData.id].active && !alarmActive) {
            setAlarmActive(true)
            setRecording(true)

            // Calculate elapsed time
            const startTime = new Date(updatedEmergencies[userData.id].timestamp).getTime()
            const currentTime = new Date().getTime()
            const elapsed = Math.floor((currentTime - startTime) / 1000)
            setElapsedTime(elapsed)

            // Start timer
            if (timerRef.current) clearInterval(timerRef.current)
            timerRef.current = setInterval(() => {
              setElapsedTime((prev) => prev + 1)
            }, 1000)
          } else if (!updatedEmergencies[userData.id].active && alarmActive) {
            setAlarmActive(false)
            setRecording(false)
            setElapsedTime(0)
            if (timerRef.current) clearInterval(timerRef.current)
          }
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    // Set map ready after a delay to ensure DOM is ready
    const mapReadyTimeout = setTimeout(() => {
      setMapReady(true)
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      clearTimeout(mapReadyTimeout)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router, alarmActive])

  const triggerAlarm = () => {
    setAlarmActive(true)
    setRecording(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    // Send emergency alerts to trusted contacts
    if (user) {
      // Create emergency data
      const emergencyData = {
        userId: user.id,
        userName: user.fullName,
        timestamp: new Date().toISOString(),
        location: location,
        active: true,
        braceletCode: user.braceletCode,
        // Flag to indicate that an alarm should play on trusted contacts' devices
        playAlarmOnContact: true,
      }

      // Store emergency data in localStorage
      const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
      emergencies[user.id] = emergencyData
      localStorage.setItem("emergencies", JSON.stringify(emergencies))

      // Also store in emergency history
      const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}")
      if (!emergencyHistory[user.id]) {
        emergencyHistory[user.id] = []
      }

      // If it's an array, push to it, otherwise create a new array
      if (Array.isArray(emergencyHistory[user.id])) {
        emergencyHistory[user.id].push(emergencyData)
      } else {
        emergencyHistory[user.id] = [emergencyHistory[user.id], emergencyData]
      }

      localStorage.setItem("emergencyHistory", JSON.stringify(emergencyHistory))

      // Dispatch storage event for cross-tab communication
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "emergencies",
          newValue: JSON.stringify(emergencies),
        }),
      )

      // Set map ready after a short delay
      setTimeout(() => {
        setMapReady(true)
      }, 500)
    }
  }

  const cancelAlarm = () => {
    setAlarmActive(false)
    setRecording(false)
    setElapsedTime(0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Cancel emergency alerts
    if (user) {
      const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
      if (emergencies[user.id]) {
        emergencies[user.id].active = false
        emergencies[user.id].cancelledAt = new Date().toISOString()
        emergencies[user.id].playAlarmOnContact = false
        localStorage.setItem("emergencies", JSON.stringify(emergencies))

        // Update emergency history
        const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}")
        if (Array.isArray(emergencyHistory[user.id])) {
          // Find the most recent alert and update it
          const lastIndex = emergencyHistory[user.id].length - 1
          if (lastIndex >= 0) {
            emergencyHistory[user.id][lastIndex] = {
              ...emergencyHistory[user.id][lastIndex],
              active: false,
              cancelledAt: new Date().toISOString(),
            }
          }
        } else if (emergencyHistory[user.id]) {
          emergencyHistory[user.id] = {
            ...emergencyHistory[user.id],
            active: false,
            cancelledAt: new Date().toISOString(),
          }
        }
        localStorage.setItem("emergencyHistory", JSON.stringify(emergencyHistory))

        // Dispatch storage event for cross-tab communication
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "emergencies",
            newValue: JSON.stringify(emergencies),
          }),
        )
      }
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center py-4">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-pink-700">Emergency Alert</h1>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {alarmActive ? (
          <>
            <div className="text-center">
              <div className="text-red-500 text-xl font-bold animate-pulse">ALERT ACTIVE</div>
              <p className="text-gray-500 mt-2">Notifications sent to your trusted contacts</p>
            </div>

            {!mapReady ? (
              <Skeleton className="w-full h-[200px] rounded-md" />
            ) : (
              <LiveLocationMap initialLocation={location} userId={user.id} height="200px" />
            )}

            <Card className="w-full bg-pink-50 border-pink-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className={`bg-pink-500 rounded-full p-3 ${recording ? "animate-pulse" : ""}`}>
                    <Mic className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Audio Recording</h3>
                    <p className="text-sm text-gray-500">
                      {recording ? `Recording: ${formatTime(elapsedTime)}` : "Not recording"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="w-full bg-pink-50 border-pink-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-pink-500 rounded-full p-3 animate-pulse">
                    <Bell className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Alert Status</h3>
                    <p className="text-sm text-gray-500">
                      Alarm is playing on {trustedContacts.length} trusted contact device
                      {trustedContacts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={cancelAlarm}
              className="w-full h-16 bg-red-500 hover:bg-red-600 flex items-center justify-center space-x-3"
            >
              <X className="h-6 w-6" />
              <span className="text-lg font-medium">Cancel Alert</span>
            </Button>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-pink-700">Emergency Button</h2>
              <p className="text-gray-500 mt-2">Press the button below in case of emergency</p>
            </div>

            <Button
              onClick={triggerAlarm}
              className="w-64 h-64 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center"
            >
              <AlertTriangle className="h-24 w-24" />
            </Button>

            <div className="text-center text-sm text-gray-500 max-w-xs">
              This will send an alert to your trusted contacts and the nearest police station, along with your location
            </div>

            <Card className="w-full">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-pink-500" />
                  <div>
                    <h3 className="font-medium">Trusted Contacts</h3>
                    <p className="text-sm text-gray-500">
                      {trustedContacts.length > 0
                        ? `${trustedContacts.length} contact${trustedContacts.length !== 1 ? "s" : ""} will be notified`
                        : "You have no trusted contacts yet"}
                    </p>
                  </div>
                </div>
                {trustedContacts.length === 0 && (
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-pink-500 hover:bg-pink-600"
                    onClick={() => router.push("/trusted-contacts")}
                  >
                    Add Trusted Contacts
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
