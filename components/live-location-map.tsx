"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"

interface LiveLocationMapProps {
  initialLocation?: [number, number]
  userId?: string
  height?: string
  zoom?: number
  showControls?: boolean
}

export default function LiveLocationMap({
  initialLocation = [40.7128, -74.006],
  userId,
  height = "300px",
  zoom = 15,
  showControls = true,
}: LiveLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<L.Map | null>(null)
  const [marker, setMarker] = useState<L.Marker | null>(null)
  const [location, setLocation] = useState<[number, number]>(initialLocation)
  const [isTracking, setIsTracking] = useState(false)
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Function to simulate location updates (in a real app, this would use actual GPS)
  const simulateLocationUpdate = () => {
    setLocation((prevLocation) => {
      // Simulate small movement in random direction
      const latChange = (Math.random() - 0.5) * 0.0005
      const lngChange = (Math.random() - 0.5) * 0.0005
      return [prevLocation[0] + latChange, prevLocation[1] + lngChange]
    })
  }

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const newMap = L.map(mapRef.current).setView(initialLocation, zoom)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(newMap)

    const newMarker = L.marker(initialLocation).addTo(newMap)
    newMarker.bindPopup("Current Location").openPopup()

    setMap(newMap)
    setMarker(newMarker)

    return () => {
      newMap.remove()
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [initialLocation, zoom])

  // Update marker position when location changes
  useEffect(() => {
    if (map && marker) {
      marker.setLatLng(location)
      map.panTo(location)

      // Store location in localStorage for emergency sharing
      if (userId) {
        const emergencyData = JSON.parse(localStorage.getItem("emergencyData") || "{}")
        emergencyData[userId] = {
          location,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem("emergencyData", JSON.stringify(emergencyData))
      }
    }
  }, [location, map, marker, userId])

  // Start/stop location tracking
  useEffect(() => {
    if (isTracking) {
      locationIntervalRef.current = setInterval(simulateLocationUpdate, 3000)
    } else if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current)
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [isTracking])

  return (
    <Card className="overflow-hidden border border-gray-200">
      <div ref={mapRef} style={{ height }} className="w-full" />
      {showControls && (
        <div className="p-2 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Location: {location[0].toFixed(6)}, {location[1].toFixed(6)}
          </div>
          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`text-xs px-2 py-1 rounded ${isTracking ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
          >
            {isTracking ? "Stop Tracking" : "Start Tracking"}
          </button>
        </div>
      )}
    </Card>
  )
}
