"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, X, Mic, ArrowLeft, Bell, Users, AlertCircle, CheckCircle } from "lucide-react"
import LiveLocationMap from "@/components/live-location-map"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

export default function AlarmPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [alarmActive, setAlarmActive] = useState(false)
  const [doubtMode, setDoubtMode] = useState(false)
  const [recording, setRecording] = useState(false)
  const [location, setLocation] = useState<[number, number]>([30.4278, -9.5981]) // Default to Agadir
  const [elapsedTime, setElapsedTime] = useState(0)
  const [trustedContacts, setTrustedContacts] = useState<any[]>([])
  const [mapReady, setMapReady] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [audioChunks, setAudioChunks] = useState<string[]>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [liveStreamActive, setLiveStreamActive] = useState(false)
  const [showEmergencyTypeDialog, setShowEmergencyTypeDialog] = useState(false)
  const [emergencyType, setEmergencyType] = useState<string>("")

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

    // Get trusted contacts - all users that the current user trusts
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
      setDoubtMode(emergencies[userData.id].doubtMode || false)
      setRecording(true)
      setLiveStreamActive(true)

      // Load any existing audio chunks
      if (emergencies[userData.id].audioChunks) {
        setAudioChunks(emergencies[userData.id].audioChunks)
      }

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
            setDoubtMode(updatedEmergencies[userData.id].doubtMode || false)
            setRecording(true)
            setLiveStreamActive(true)

            // Load any existing audio chunks
            if (updatedEmergencies[userData.id].audioChunks) {
              setAudioChunks(updatedEmergencies[userData.id].audioChunks)
            }

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
            setDoubtMode(false)
            setRecording(false)
            setLiveStreamActive(false)
            setElapsedTime(0)
            setAudioChunks([])
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

  // Simulate recording and streaming audio chunks
  useEffect(() => {
    if (recording && liveStreamActive) {
      const recordingInterval = setInterval(() => {
        // Generate a mock audio chunk (in a real app, this would be actual audio data)
        const mockAudioChunk = `audio_chunk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

        setAudioChunks((prev) => {
          const newChunks = [...prev, mockAudioChunk]

          // Update the emergency data with the new audio chunks
          if (user) {
            const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
            if (emergencies[user.id]) {
              // Update the audio chunks
              emergencies[user.id].audioChunks = newChunks

              // Add a timestamp to the latest chunk for live streaming
              emergencies[user.id].latestAudioChunk = {
                chunk: mockAudioChunk,
                timestamp: new Date().toISOString(),
              }

              localStorage.setItem("emergencies", JSON.stringify(emergencies))

              // Also update in emergency history
              const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}")
              if (Array.isArray(emergencyHistory[user.id]) && emergencyHistory[user.id].length > 0) {
                const lastIndex = emergencyHistory[user.id].length - 1
                if (lastIndex >= 0) {
                  emergencyHistory[user.id][lastIndex].audioChunks = newChunks
                  emergencyHistory[user.id][lastIndex].latestAudioChunk = {
                    chunk: mockAudioChunk,
                    timestamp: new Date().toISOString(),
                  }
                }
              }
              localStorage.setItem("emergencyHistory", JSON.stringify(emergencyHistory))

              // Dispatch storage event for cross-tab communication to notify listeners
              window.dispatchEvent(
                new StorageEvent("storage", {
                  key: "emergencies",
                  newValue: JSON.stringify(emergencies),
                }),
              )
            }
          }

          return newChunks
        })
      }, 5000) // Add a new chunk every 5 seconds

      return () => clearInterval(recordingInterval)
    }
  }, [recording, liveStreamActive, user])

  const triggerAlarm = (isDoubtMode = false) => {
    setAlarmActive(true)
    setDoubtMode(isDoubtMode)
    setRecording(true)
    setLiveStreamActive(true)

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
        doubtMode: isDoubtMode,
        braceletCode: user.braceletCode,
        // Flag to indicate that an alarm should play on trusted contacts' devices
        playAlarmOnContact: !isDoubtMode, // Don't play alarm for doubt mode
        audioChunks: [], // Initialize empty audio chunks array
        liveStreamActive: true, // Indicate that live streaming is active
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

      // Always store as an array
      if (Array.isArray(emergencyHistory[user.id])) {
        emergencyHistory[user.id].push(emergencyData)
      } else {
        // Convert to array if it wasn't already
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

  const handleCancelClick = () => {
    setShowCancelDialog(true)
  }

  const handleFalseAlarm = () => {
    cancelAlarm(false)
  }

  const handleRealEmergency = () => {
    setShowCancelDialog(false)
    setShowEmergencyTypeDialog(true)
  }

  const handleEmergencyTypeSelect = () => {
    cancelAlarm(true)
    setShowEmergencyTypeDialog(false)
  }

  const cancelAlarm = (wasRealEmergency: boolean) => {
    setAlarmActive(false)
    setDoubtMode(false)
    setRecording(false)
    setLiveStreamActive(false)
    setElapsedTime(0)
    setShowCancelDialog(false)

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
        emergencies[user.id].liveStreamActive = false
        emergencies[user.id].wasRealEmergency = wasRealEmergency
        emergencies[user.id].cancellationReason = wasRealEmergency ? "Emergency resolved" : "False alarm"

        // Add emergency type if it was a real emergency
        if (wasRealEmergency && emergencyType) {
          emergencies[user.id].emergencyType = emergencyType
        }

        localStorage.setItem("emergencies", JSON.stringify(emergencies))

        // Update emergency history
        const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}")
        if (Array.isArray(emergencyHistory[user.id]) && emergencyHistory[user.id].length > 0) {
          // Find the most recent alert and update it
          const lastIndex = emergencyHistory[user.id].length - 1
          if (lastIndex >= 0) {
            emergencyHistory[user.id][lastIndex] = {
              ...emergencyHistory[user.id][lastIndex],
              active: false,
              cancelledAt: new Date().toISOString(),
              liveStreamActive: false,
              wasRealEmergency: wasRealEmergency,
              cancellationReason: wasRealEmergency ? "Emergency resolved" : "False alarm",
              emergencyType: wasRealEmergency ? emergencyType : undefined,
            }
          }
        } else if (emergencyHistory[user.id]) {
          emergencyHistory[user.id] = {
            ...emergencyHistory[user.id],
            active: false,
            cancelledAt: new Date().toISOString(),
            liveStreamActive: false,
            wasRealEmergency: wasRealEmergency,
            cancellationReason: wasRealEmergency ? "Emergency resolved" : "False alarm",
            emergencyType: wasRealEmergency ? emergencyType : undefined,
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
              <div className={`text-xl font-bold animate-pulse ${doubtMode ? "text-yellow-500" : "text-red-500"}`}>
                {doubtMode ? "DOUBT MODE ACTIVE" : "ALERT ACTIVE"}
              </div>
              <p className="text-gray-500 mt-2">
                {doubtMode
                  ? "Situation logged, no emergency alert sent"
                  : "Notifications sent to your trusted contacts"}
              </p>
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
                    <div className="flex items-center">
                      <p className="text-xs text-gray-400 mt-1 mr-2">{audioChunks.length} audio chunks recorded</p>
                      {liveStreamActive && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full animate-pulse">
                          Live
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!doubtMode && (
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
            )}

            <Button
              onClick={handleCancelClick}
              className="w-full h-16 bg-green-500 hover:bg-green-600 flex items-center justify-center space-x-3"
            >
              <X className="h-6 w-6" />
              <span className="text-lg font-medium">Cancel Alert</span>
            </Button>
          </>
        ) : (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-pink-700">Emergency Options</h2>
              <p className="text-gray-500 mt-2">Choose the appropriate action for your situation</p>
            </div>

            <div className="space-y-6 w-full">
              <Button
                onClick={() => triggerAlarm(false)}
                className="w-full h-20 bg-red-500 hover:bg-red-600 flex items-center justify-center space-x-3"
              >
                <AlertTriangle className="h-6 w-6" />
                <span className="text-lg font-medium">Emergency Alert</span>
              </Button>

              <Button
                onClick={() => triggerAlarm(true)}
                className="w-full h-16 bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center space-x-3"
              >
                <AlertCircle className="h-6 w-6" />
                <span className="text-lg font-medium">Doubt Mode</span>
              </Button>

              <div className="text-center text-sm text-gray-500 max-w-xs mx-auto">
                <p className="mb-2">
                  <strong>Emergency Alert:</strong> Sends immediate notification to all trusted contacts with alarm
                </p>
                <p>
                  <strong>Doubt Mode:</strong> Records situation without sending alarm, but logs your location and audio
                </p>
              </div>
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

      {/* Cancel Alert Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Alert</DialogTitle>
            <DialogDescription>Please select the reason for cancelling this alert:</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              onClick={handleFalseAlarm}
              className="h-16 bg-green-500 hover:bg-green-600 flex items-center justify-center space-x-3"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>False Alarm - Nothing Happened</span>
            </Button>

            <Button
              onClick={handleRealEmergency}
              className="h-16 bg-red-500 hover:bg-red-600 flex items-center justify-center space-x-3"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Emergency Resolved - Something Occurred</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Type Dialog */}
      <Dialog open={showEmergencyTypeDialog} onOpenChange={setShowEmergencyTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Emergency Type</DialogTitle>
            <DialogDescription>Please select the type of emergency that occurred:</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emergency-type">Emergency Type</Label>
              <Select value={emergencyType} onValueChange={setEmergencyType}>
                <SelectTrigger id="emergency-type">
                  <SelectValue placeholder="Select emergency type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="stalking">Stalking</SelectItem>
                  <SelectItem value="assault">Assault</SelectItem>
                  <SelectItem value="robbery">Robbery</SelectItem>
                  <SelectItem value="medical">Medical Emergency</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleEmergencyTypeSelect}
              className="bg-pink-500 hover:bg-pink-600"
              disabled={!emergencyType}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
