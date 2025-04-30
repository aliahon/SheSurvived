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

// Generate realistic incident data around Agadir
const generateAgadirIncidentData = () => {
  // Agadir coordinates
  const agadirCenter: [number, number] = [30.4278, -9.5981]

  // Get current hour to determine if it's day or night
  const currentHour = new Date().getHours()
  const isDaytime = currentHour >= 6 && currentHour < 20 // 6 AM to 8 PM is considered daytime

  // Specific incident locations in Agadir (these would be real incident reports in a real app)
  const incidents = [
    { coords: [30.4186, -9.6001], time: 14, severity: 0.8 }, // Afternoon incident
    { coords: [30.4163, -9.588], time: 22, severity: 0.9 }, // Night incident
    { coords: [30.4261, -9.5862], time: 19, severity: 0.7 }, // Evening incident
    { coords: [30.401, -9.6038], time: 10, severity: 0.5 }, // Morning incident
    { coords: [30.438, -9.578], time: 2, severity: 0.9 }, // Late night incident
    { coords: [30.445, -9.595], time: 16, severity: 0.6 }, // Afternoon incident
    { coords: [30.433, -9.573], time: 23, severity: 0.8 }, // Night incident
    { coords: [30.415, -9.627], time: 7, severity: 0.4 }, // Early morning incident
    { coords: [30.452, -9.637], time: 20, severity: 0.7 }, // Evening incident
  ]

  // Filter incidents based on time of day
  const filteredIncidents = isDaytime
    ? incidents.filter((inc) => inc.time >= 6 && inc.time < 20) // Daytime incidents
    : incidents.filter((inc) => inc.time < 6 || inc.time >= 20) // Nighttime incidents

  return { incidents: filteredIncidents, isDaytime }
}

export default function HeatMap({ center = [30.4278, -9.5981], zoom = 13, height = "400px" }: HeatMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number]>([30.4278, -9.5981]) // Default Agadir center
  const [isDaytime, setIsDaytime] = useState(true)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize the map centered on Agadir
    const map = L.map(mapRef.current).setView(center, zoom)

    // Add the tile layer (OpenStreetMap)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Generate incident data
    const { incidents, isDaytime: isDay } = generateAgadirIncidentData()
    setIsDaytime(isDay)

    // Add incident markers
    incidents.forEach((incident) => {
      // Create a red circle marker for each incident
      const marker = L.circleMarker(incident.coords as L.LatLngExpression, {
        radius: 8 + incident.severity * 5, // Size based on severity
        color: "red",
        fillColor: "#f03",
        fillOpacity: 0.7,
        weight: 2,
      }).addTo(map)

      // Add a pulsing effect for recent incidents (higher severity)
      if (incident.severity > 0.7) {
        const pulseIcon = L.divIcon({
          html: `<div class="pulse-marker"></div>`,
          className: "",
          iconSize: [20, 20],
        })

        L.marker(incident.coords as L.LatLngExpression, { icon: pulseIcon }).addTo(map)
      }

      // Add popup with incident information
      const timeStr =
        incident.time < 12 ? `${incident.time} AM` : incident.time === 12 ? "12 PM" : `${incident.time - 12} PM`

      marker.bindPopup(`
        <b>Incident Report</b><br>
        Time: ${timeStr}<br>
        Severity: ${Math.round(incident.severity * 10)}/10<br>
        <span class="text-red-500">Exercise caution in this area</span>
      `)
    })

    // Add CSS for the pulsing marker
    const style = document.createElement("style")
    style.textContent = `
      .pulse-marker {
        position: relative;
        width: 20px;
        height: 20px;
      }
      .pulse-marker:before {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        background-color: rgba(255, 0, 0, 0.3);
        border-radius: 50%;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% {
          transform: scale(0.5);
          opacity: 1;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)

    // Add user marker to the map
    const userIcon = L.divIcon({
      html: `<div class="user-marker">
              <div class="user-marker-icon"></div>
              <div class="user-marker-pulse"></div>
            </div>`,
      className: "user-location-marker",
      iconSize: [20, 20],
    })

    // Add CSS for the user marker
    style.textContent += `
      .user-marker {
        position: relative;
        width: 20px;
        height: 20px;
      }
      .user-marker-icon {
        position: absolute;
        top: 5px;
        left: 5px;
        width: 10px;
        height: 10px;
        background-color: #EC4899;
        border-radius: 50%;
        z-index: 2;
        box-shadow: 0 0 0 2px white;
      }
      .user-marker-pulse {
        position: absolute;
        top: 0;
        left: 0;
        width: 20px;
        height: 20px;
        background-color: rgba(236, 72, 153, 0.4);
        border-radius: 50%;
        z-index: 1;
        animation: pulse 2s infinite;
      }
    `

    // Add user marker to the map
    const userMarker = L.marker(userLocation, { icon: userIcon }).addTo(map)
    userMarker.bindPopup("<b>Your Location</b><br>Agadir, Morocco").openPopup()

    // Simulate user movement slightly every few seconds
    const moveInterval = setInterval(() => {
      const newLat = userLocation[0] + (Math.random() - 0.5) * 0.0008
      const newLng = userLocation[1] + (Math.random() - 0.5) * 0.0008
      setUserLocation([newLat, newLng])
      userMarker.setLatLng([newLat, newLng])
    }, 5000)

    setMapInstance(map)

    // Cleanup function
    return () => {
      clearInterval(moveInterval)
      map.remove()
      document.head.removeChild(style)
    }
  }, [center, zoom])

  return (
    <div className="rounded-md overflow-hidden border border-gray-200">
      <div ref={mapRef} style={{ height }} className="w-full" />
      <div className="p-2 bg-white text-xs flex justify-between items-center">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full bg-red-500 mr-1"></span>
          <span className="mr-2">Incident Location</span>
        </div>
        <div className="text-gray-500">
          <span>Agadir, Morocco • {isDaytime ? "Daytime" : "Nighttime"} View</span>
        </div>
      </div>
    </div>
  )
}
