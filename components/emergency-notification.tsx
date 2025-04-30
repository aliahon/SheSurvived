"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, MapPin, X, Volume2, VolumeX } from "lucide-react"
import Link from "next/link"

interface EmergencyNotificationProps {
  emergency?: {
    userId: string
    userName: string
    timestamp: string
    location: [number, number]
    playAlarmOnContact?: boolean
  }
  onDismiss?: () => void
}

export default function EmergencyNotification({ emergency, onDismiss }: EmergencyNotificationProps) {
  const [timeAgo, setTimeAgo] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!emergency) return

    const updateTimeAgo = () => {
      const now = new Date()
      const timestamp = new Date(emergency.timestamp)
      const diffMs = now.getTime() - timestamp.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins < 1) {
        setTimeAgo("just now")
      } else if (diffMins === 1) {
        setTimeAgo("1 minute ago")
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minutes ago`)
      } else {
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours === 1) {
          setTimeAgo("1 hour ago")
        } else {
          setTimeAgo(`${diffHours} hours ago`)
        }
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000)

    // Play alarm sound if requested
    if (emergency.playAlarmOnContact && !isMuted) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          audioContextRef.current = new AudioContext()
          oscillatorRef.current = audioContextRef.current.createOscillator()
          gainNodeRef.current = audioContextRef.current.createGain()

          oscillatorRef.current.type = "triangle"
          oscillatorRef.current.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
          gainNodeRef.current.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)

          oscillatorRef.current.connect(gainNodeRef.current)
          gainNodeRef.current.connect(audioContextRef.current.destination)

          oscillatorRef.current.start()

          // Modulate the frequency for alarm effect
          intervalRef.current = setInterval(() => {
            if (oscillatorRef.current) {
              const currentFreq = oscillatorRef.current.frequency.value
              oscillatorRef.current.frequency.setValueAtTime(
                currentFreq === 800 ? 600 : 800,
                audioContextRef.current!.currentTime,
              )
            }
          }, 400)
        }
      } catch (error) {
        console.error("Error creating audio:", error)
      }
    }

    // Set up event listener for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emergencies") {
        const updatedEmergencies = JSON.parse(e.newValue || "{}")
        if (emergency.userId && updatedEmergencies[emergency.userId]) {
          // If the emergency is no longer active, stop the alarm
          if (!updatedEmergencies[emergency.userId].active && emergency.playAlarmOnContact && !isMuted) {
            stopAlarm()
          }
        }
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      stopAlarm()
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [emergency, isMuted])

  const stopAlarm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.stop()
      audioContextRef.current.close()
      oscillatorRef.current = null
      audioContextRef.current = null
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      // Unmute - restart the alarm
      if (emergency?.playAlarmOnContact) {
        try {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext
          if (AudioContext) {
            audioContextRef.current = new AudioContext()
            oscillatorRef.current = audioContextRef.current.createOscillator()
            gainNodeRef.current = audioContextRef.current.createGain()

            oscillatorRef.current.type = "triangle"
            oscillatorRef.current.frequency.setValueAtTime(800, audioContextRef.current.currentTime)
            gainNodeRef.current.gain.setValueAtTime(0.3, audioContextRef.current.currentTime)

            oscillatorRef.current.connect(gainNodeRef.current)
            gainNodeRef.current.connect(audioContextRef.current.destination)

            oscillatorRef.current.start()

            // Modulate the frequency for alarm effect
            intervalRef.current = setInterval(() => {
              if (oscillatorRef.current) {
                const currentFreq = oscillatorRef.current.frequency.value
                oscillatorRef.current.frequency.setValueAtTime(
                  currentFreq === 800 ? 600 : 800,
                  audioContextRef.current!.currentTime,
                )
              }
            }, 400)
          }
        } catch (error) {
          console.error("Error creating audio:", error)
        }
      }
    } else {
      // Mute - stop the alarm
      stopAlarm()
    }

    setIsMuted(!isMuted)
  }

  if (!emergency) return null

  return (
    <Card className="bg-red-50 border-red-200 mb-4 animate-pulse">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-red-500 rounded-full p-2 mt-1">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-red-700">EMERGENCY ALERT</h3>
              <p className="text-sm text-gray-700">{emergency.userName} needs help!</p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
              <div className="flex items-center mt-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3 mr-1" />
                <span>
                  {emergency.location[0].toFixed(6)}, {emergency.location[1].toFixed(6)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {emergency.playAlarmOnContact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="h-6 w-6 p-0 mr-1"
                title={isMuted ? "Unmute alarm" : "Mute alarm"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-red-500" />}
              </Button>
            )}
            {onDismiss && (
              <Button variant="ghost" size="sm" onClick={onDismiss} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <Link href={`/emergency-track/${emergency.userId}`} className="flex-1">
            <Button className="w-full bg-red-500 hover:bg-red-600 text-white">Track Location</Button>
          </Link>
          <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">
            Call
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
