"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

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
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [location, setLocation] = useState<[number, number]>(initialLocation)
  const [isTracking, setIsTracking] = useState(false)
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [mapInitialized, setMapInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Function to simulate location updates (in a real app, this would use actual GPS)
  const simulateLocationUpdate = () => {
    setLocation((prevLocation) => {
      // Simulate small movement in random direction
      const latChange = (Math.random() - 0.5) * 0.0005
      const lngChange = (Math.random() - 0.5) * 0.0005
      return [prevLocation[0] + latChange, prevLocation[1] + lngChange]
    })
  }

  // Initialize map with delay to ensure DOM is ready
  useEffect(() => {
    // Wait for the component to be fully mounted before initializing the map
    const initTimeout = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current) return

      try {
        // Create the map instance with zoom control disabled (we'll add it in a better position)
        const newMap = L.map(mapRef.current, {
          zoomControl: false,
        }).setView(initialLocation, zoom)

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(newMap)

        // Add zoom control in a better position
        L.control.zoom({ position: "bottomright" }).addTo(newMap)

        // Create marker
        const newMarker = L.marker(initialLocation).addTo(newMap)
        newMarker.bindPopup("Current Location").openPopup()

        // Store references
        mapInstanceRef.current = newMap
        markerRef.current = newMarker

        // Set map as initialized
        setMapInitialized(true)
        setIsLoading(false)

        // Invalidate size after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize()
          }
        }, 300)
      } catch (error) {
        console.error("Error initializing map:", error)
        setIsLoading(false)
      }
    }, 500) // Longer delay to ensure DOM is ready

    return () => {
      // Clean up
      clearTimeout(initTimeout)

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [initialLocation, zoom])

  // Update marker position when location changes
  useEffect(() => {
    if (!mapInitialized || !mapInstanceRef.current || !markerRef.current) return

    try {
      // Update marker position
      markerRef.current.setLatLng(location)

      // Only update map view if tracking is active
      if (isTracking) {
        // Use setView with animation disabled to avoid _leaflet_pos errors
        mapInstanceRef.current.setView(location, mapInstanceRef.current.getZoom(), {
          animate: false,
        })
      }

      // Store location in localStorage for emergency sharing
      if (userId) {
        const emergencyData = JSON.parse(localStorage.getItem("emergencyData") || "{}")
        emergencyData[userId] = {
          location,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem("emergencyData", JSON.stringify(emergencyData))
      }
    } catch (error) {
      console.error("Error updating map:", error)
    }
  }, [location, mapInitialized, userId, isTracking])

  // Start/stop location tracking
  useEffect(() => {
    if (isTracking && mapInitialized) {
      locationIntervalRef.current = setInterval(simulateLocationUpdate, 3000)
    } else if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current)
    }

    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current)
      }
    }
  }, [isTracking, mapInitialized])

  // Handle window resize to invalidate map size
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current && mapInitialized) {
        mapInstanceRef.current.invalidateSize()
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [mapInitialized])

  return (
    <Card className="overflow-hidden border border-gray-200">
      {isLoading && <Skeleton className="w-full" style={{ height }} />}
      <div
        ref={mapRef}
        style={{
          height,
          display: isLoading ? "none" : "block", // Only show map when loaded
        }}
        className="w-full"
      />
      {showControls && mapInitialized && (
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
