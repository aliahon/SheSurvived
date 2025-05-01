"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, MapPin, X, Volume2, VolumeX, AlertCircle } from "lucide-react"
import Link from "next/link"
import AudioPlayer from "@/components/audio-player"

interface EmergencyNotificationProps {
  emergency?: {
    userId: string
    userName: string
    timestamp: string
    location: [number, number]
    playAlarmOnContact?: boolean
    doubtMode?: boolean
    audioChunks?: string[]
    latestAudioChunk?: {
      chunk: string
      timestamp: string
    }
    liveStreamActive?: boolean
  }
  onDismiss?: () => void
}

export default function EmergencyNotification({ emergency, onDismiss }: EmergencyNotificationProps) {
  const [timeAgo, setTimeAgo] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [showAudioPlayer, setShowAudioPlayer] = useState(false)
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

    // Play alarm sound if requested and not in doubt mode
    if (emergency.playAlarmOnContact && !isMuted && !emergency.doubtMode) {
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
      if (emergency?.playAlarmOnContact && !emergency.doubtMode) {
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

  const toggleAudioPlayer = () => {
    setShowAudioPlayer(!showAudioPlayer)
  }

  if (!emergency) return null

  const isDoubtMode = emergency.doubtMode === true
  const hasAudio = emergency.audioChunks && emergency.audioChunks.length > 0
  const isLiveStreaming = emergency.liveStreamActive === true

  return (
    <Card
      className={`mb-4 animate-pulse ${isDoubtMode ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`rounded-full p-2 mt-1 ${isDoubtMode ? "bg-yellow-500" : "bg-red-500"}`}>
              {isDoubtMode ? (
                <AlertCircle className="h-4 w-4 text-white" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-white" />
              )}
            </div>
            <div>
              <h3 className={`font-bold ${isDoubtMode ? "text-yellow-700" : "text-red-700"}`}>
                {isDoubtMode ? "DOUBT SITUATION" : "EMERGENCY ALERT"}
              </h3>
              <p className="text-sm text-gray-700">
                {isDoubtMode
                  ? `${emergency.userName} reported a suspicious situation`
                  : `${emergency.userName} needs help!`}
              </p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
              <div className="flex items-center mt-1 text-xs text-gray-600">
                <MapPin className="h-3 w-3 mr-1" />
                <span>
                  {emergency.location[0].toFixed(6)}, {emergency.location[1].toFixed(6)}
                </span>
              </div>
              {hasAudio && isLiveStreaming && (
                <button
                  onClick={toggleAudioPlayer}
                  className="mt-1 text-xs text-pink-600 hover:text-pink-800 flex items-center"
                >
                  {showAudioPlayer ? "Hide live audio" : "Listen to live audio"}
                  {isLiveStreaming && <span className="ml-1 h-2 w-2 bg-pink-500 rounded-full animate-pulse"></span>}
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {emergency.playAlarmOnContact && !isDoubtMode && (
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

        {showAudioPlayer && hasAudio && (
          <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
            <AudioPlayer
              audioChunks={emergency.audioChunks || []}
              isLive={isLiveStreaming}
              latestTimestamp={emergency.latestAudioChunk?.timestamp}
            />
          </div>
        )}

        <div className="mt-3 flex space-x-2">
          <Link href={`/emergency-track/${emergency.userId}`} className="flex-1">
            <Button
              className={`w-full text-white ${
                isDoubtMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              Track Location
            </Button>
          </Link>
          <Button
            variant="outline"
            className={
              isDoubtMode
                ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                : "border-red-200 text-red-700 hover:bg-red-50"
            }
          >
            Call
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
