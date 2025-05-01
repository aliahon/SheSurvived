"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react"

interface AudioPlayerProps {
  audioChunks: string[]
  isLive?: boolean
  latestTimestamp?: string
  onSeek?: (chunkIndex: number) => void
}

export default function AudioPlayer({ audioChunks, isLive = false, latestTimestamp, onSeek }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [currentTime, setCurrentTime] = useState("00:00")
  const [totalTime, setTotalTime] = useState("00:00")

  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate total duration based on number of chunks (5 seconds per chunk)
  useEffect(() => {
    const totalDuration = audioChunks.length * 5 // 5 seconds per chunk
    setDuration(totalDuration)
    setTotalTime(formatTime(totalDuration))
  }, [audioChunks])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPlayback()
    }
  }, [])

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Start playback
  const startPlayback = () => {
    if (audioChunks.length === 0) return

    setIsPlaying(true)

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (AudioContext) {
        audioContextRef.current = new AudioContext()
        oscillatorRef.current = audioContextRef.current.createOscillator()
        gainNodeRef.current = audioContextRef.current.createGain()

        oscillatorRef.current.type = "sine"
        oscillatorRef.current.frequency.setValueAtTime(440, audioContextRef.current.currentTime)
        gainNodeRef.current.gain.setValueAtTime(isMuted ? 0 : volume, audioContextRef.current.currentTime)

        oscillatorRef.current.connect(gainNodeRef.current)
        gainNodeRef.current.connect(audioContextRef.current.destination)

        oscillatorRef.current.start()

        // Update progress every 100ms
        progressIntervalRef.current = setInterval(() => {
          // Calculate current time based on chunk index and progress within chunk
          const chunkProgress = currentChunkIndex * 5 + progress * 5
          setCurrentTime(formatTime(chunkProgress))
        }, 100)

        // Move to next chunk every 5 seconds
        playbackIntervalRef.current = setInterval(() => {
          setCurrentChunkIndex((prev) => {
            if (prev >= audioChunks.length - 1) {
              // If we're at the end, stop playback
              if (!isLive) {
                stopPlayback()
                return 0
              }
              return prev
            }
            return prev + 1
          })
          setProgress(0) // Reset progress for new chunk
        }, 5000)

        // Simulate progress within a chunk
        const progressStep = 0.02 // Update every 100ms = 0.02 progress per step (for 5 seconds)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const newProgress = prev + progressStep
            if (newProgress >= 1) {
              return 1
            }
            return newProgress
          })
        }, 100)

        // Store the interval for cleanup
        progressIntervalRef.current = progressInterval
      }
    } catch (error) {
      console.error("Error starting audio playback:", error)
    }
  }

  // Stop playback
  const stopPlayback = () => {
    setIsPlaying(false)

    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current)
      playbackIntervalRef.current = null
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }

    if (oscillatorRef.current && audioContextRef.current) {
      oscillatorRef.current.stop()
      audioContextRef.current.close()
      oscillatorRef.current = null
      audioContextRef.current = null
    }
  }

  // Toggle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      stopPlayback()
    } else {
      startPlayback()
    }
  }

  // Skip to previous chunk
  const skipBack = () => {
    stopPlayback()
    setCurrentChunkIndex((prev) => (prev > 0 ? prev - 1 : 0))
    setProgress(0)
    if (onSeek) onSeek(currentChunkIndex > 0 ? currentChunkIndex - 1 : 0)
    startPlayback()
  }

  // Skip to next chunk
  const skipForward = () => {
    if (currentChunkIndex < audioChunks.length - 1) {
      stopPlayback()
      setCurrentChunkIndex((prev) => prev + 1)
      setProgress(0)
      if (onSeek) onSeek(currentChunkIndex + 1)
      startPlayback()
    }
  }

  // Seek to a specific position in the recording
  const handleSeek = (value: number[]) => {
    const seekPosition = value[0]
    const totalChunks = audioChunks.length

    // Calculate which chunk to play and progress within that chunk
    const targetSeconds = seekPosition * duration
    const targetChunk = Math.floor(targetSeconds / 5)
    const chunkProgress = (targetSeconds % 5) / 5

    stopPlayback()
    setCurrentChunkIndex(Math.min(targetChunk, totalChunks - 1))
    setProgress(chunkProgress)

    if (onSeek) onSeek(Math.min(targetChunk, totalChunks - 1))

    // If was playing, restart playback
    if (isPlaying) {
      startPlayback()
    }
  }

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.setValueAtTime(!isMuted ? 0 : volume, audioContextRef.current?.currentTime || 0)
    }
  }

  // Calculate overall progress (0-1)
  const calculateOverallProgress = () => {
    if (audioChunks.length === 0) return 0
    return (currentChunkIndex + progress) / audioChunks.length
  }

  // Get time since latest chunk (for live streaming)
  const getLatestChunkTime = () => {
    if (!latestTimestamp) return null

    const chunkTime = new Date(latestTimestamp).getTime()
    const now = new Date().getTime()
    const diffSeconds = Math.floor((now - chunkTime) / 1000)

    if (diffSeconds < 5) {
      return "Just now"
    } else if (diffSeconds < 60) {
      return `${diffSeconds} seconds ago`
    } else {
      const diffMinutes = Math.floor(diffSeconds / 60)
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
    }
  }

  return (
    <div className="space-y-2">
      {isLive && (
        <div className="flex items-center justify-between text-xs text-green-600 mb-1">
          <span className="flex items-center">
            <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1"></span>
            Live Audio
          </span>
          <span>{getLatestChunkTime()}</span>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={skipBack}
          disabled={currentChunkIndex === 0}
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={togglePlayback}>
          {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={skipForward}
          disabled={currentChunkIndex >= audioChunks.length - 1}
        >
          <SkipForward className="h-4 w-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>

      <div className="space-y-1">
        <Slider
          value={[calculateOverallProgress()]}
          max={1}
          step={0.001}
          onValueChange={handleSeek}
          className="cursor-pointer"
        />

        <div className="flex justify-between text-xs text-gray-500">
          <span>{currentTime}</span>
          <span>{totalTime}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Chunk {currentChunkIndex + 1} of {audioChunks.length}
        {isLive && audioChunks.length > 0 && " (Live streaming)"}
      </div>
    </div>
  )
}
