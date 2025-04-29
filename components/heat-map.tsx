"use client"

import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.heat"

// Define the HeatMapProps interface
interface HeatMapProps {
  center?: [number, number]
  zoom?: number
  height?: string
}

// Generate random heat map data
const generateHeatMapData = (center: [number, number], count: number, radius: number) => {
  const data = []
  const [centerLat, centerLng] = center

  for (let i = 0; i < count; i++) {
    // Generate points in a circle around the center
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * radius
    const lat = centerLat + distance * Math.cos(angle) * 0.01
    const lng = centerLng + distance * Math.sin(angle) * 0.01

    // Intensity is higher closer to the center (safer areas)
    const intensity = Math.random() * 0.5 + 0.5

    data.push([lat, lng, intensity])
  }

  return data
}

// Generate random safe and danger zones
const generateZones = (center: [number, number], count: number, radius: number) => {
  const zones = []
  const [centerLat, centerLng] = center

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2
    const distance = Math.random() * radius
    const lat = centerLat + distance * Math.cos(angle) * 0.01
    const lng = centerLng + distance * Math.sin(angle) * 0.01

    // Randomly determine if this is a safe or danger zone
    const isSafe = Math.random() > 0.3

    zones.push({
      position: [lat, lng],
      isSafe,
      radius: Math.random() * 100 + 50,
    })
  }

  return zones
}

export default function HeatMap({ center = [40.7128, -74.006], zoom = 13, height = "400px" }: HeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize the map
    const map = L.map(mapRef.current).setView(center, zoom)

    // Add the tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Generate heat map data
    const heatData = generateHeatMapData(center, 200, 10)

    // Add heat layer
    const heat = (L as any)
      .heatLayer(heatData, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        gradient: {
          0.4: "green",
          0.6: "lime",
          0.7: "yellow",
          0.8: "orange",
          0.9: "red",
        },
      })
      .addTo(map)

    // Generate and add zones
    const zones = generateZones(center, 5, 8)

    zones.forEach((zone) => {
      const { position, isSafe, radius } = zone

      if (isSafe) {
        // Safe zone - green circle with dashed border
        L.circle(position as L.LatLngExpression, {
          radius,
          color: "#10b981",
          fillColor: "#10b981",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "5, 5",
        })
          .addTo(map)
          .bindPopup("Safe Zone: Well-lit area with high foot traffic")
      } else {
        // Danger zone - red circle
        L.circle(position as L.LatLngExpression, {
          radius,
          color: "#ef4444",
          fillColor: "#ef4444",
          fillOpacity: 0.2,
          weight: 2,
        })
          .addTo(map)
          .bindPopup("Caution: Low visibility area with few people")
      }
    })

    // Determine city name based on coordinates (simplified approach)
    const cityCoordinates = {
      "New York": [40.7128, -74.006],
      "Los Angeles": [34.0522, -118.2437],
      Chicago: [41.8781, -87.6298],
      "San Francisco": [37.7749, -122.4194],
      Miami: [25.7617, -80.1918],
    }

    let cityName = "Your Location"
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (Math.abs(coords[0] - center[0]) < 0.1 && Math.abs(coords[1] - center[1]) < 0.1) {
        cityName = city
        break
      }
    }

    // Add a marker for the user's location
    const userMarker = L.marker(center).addTo(map)
    userMarker.bindPopup(`${cityName} (Demo Location)`).openPopup()

    setMapInstance(map)

    // Cleanup function
    return () => {
      map.remove()
    }
  }, [center, zoom])

  return (
    <div className="rounded-md overflow-hidden border border-gray-200">
      <div ref={mapRef} style={{ height }} className="w-full" />
    </div>
  )
}
