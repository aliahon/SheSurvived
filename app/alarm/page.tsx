"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, X, Mic, ArrowLeft, Volume2 } from "lucide-react"
import LiveLocationMap from "@/components/live-location-map"

export default function AlarmPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [alarmActive, setAlarmActive] = useState(false)
  const [recording, setRecording] = useState(false)
  const [location, setLocation] = useState<[number, number]>([40.7128, -74.006])
  const [elapsedTime, setElapsedTime] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))

    // Generate random location (in a real app, this would use actual GPS)
    const randomLat = 40.7128 + (Math.random() - 0.5) * 0.01
    const randomLng = -74.006 + (Math.random() - 0.5) * 0.01
    setLocation([randomLat, randomLng])

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [router])

  const triggerAlarm = () => {
    setAlarmActive(true)
    setRecording(true)

    // Start timer
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    // Create and play alarm sound using browser's built-in oscillator
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        const audioCtx = new AudioContext()
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()

        oscillator.type = "triangle"
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime)
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime)

        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)

        oscillator.start()

        // Store reference to stop later
        audioRef.current = {
          pause: () => {
            oscillator.stop()
            audioCtx.close()
          },
          currentTime: 0,
        } as any

        // Modulate the frequency for alarm effect
        setInterval(() => {
          oscillator.frequency.setValueAtTime(oscillator.frequency.value === 800 ? 600 : 800, audioCtx.currentTime)
        }, 400)
      }
    } catch (error) {
      console.error("Error creating audio:", error)
    }

    // Send emergency alerts to trusted contacts
    if (user) {
      // Get trusted contacts
      const allUsers = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
      const trustedContacts = user.trustedContacts || []

      // Create emergency data
      const emergencyData = {
        userId: user.id,
        userName: user.fullName,
        timestamp: new Date().toISOString(),
        location: location,
        active: true,
      }

      // Store emergency data in localStorage
      const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
      emergencies[user.id] = emergencyData
      localStorage.setItem("emergencies", JSON.stringify(emergencies))

      console.log("Emergency alert sent to trusted contacts:", trustedContacts)
    }
  }

  const cancelAlarm = () => {
    setAlarmActive(false)
    setRecording(false)
    setElapsedTime(0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Stop alarm sound
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    // Cancel emergency alerts
    if (user) {
      const emergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
      if (emergencies[user.id]) {
        emergencies[user.id].active = false
        emergencies[user.id].cancelledAt = new Date().toISOString()
        localStorage.setItem("emergencies", JSON.stringify(emergencies))
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

            <LiveLocationMap initialLocation={location} userId={user.id} height="200px" />

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
                    <Volume2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Alarm Sound</h3>
                    <p className="text-sm text-gray-500">Alarm sound is active</p>
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
          </>
        )}
      </div>
    </div>
  )
}
