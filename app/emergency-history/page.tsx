"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, AlertTriangle, MapPin, AlertCircle, Mic, CheckCircle, Tag } from "lucide-react"
import Link from "next/link"
import AudioPlayer from "@/components/audio-player"

export default function EmergencyHistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sentAlerts, setSentAlerts] = useState<any[]>([])
  const [receivedAlerts, setReceivedAlerts] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [expandedAudio, setExpandedAudio] = useState<string | null>(null)

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)

    // Get all users
    const users = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
    setAllUsers(users)

    // Get emergency history
    loadEmergencyHistory(userData, users)

    // Set up event listener for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emergencies" || e.key === "emergencyHistory") {
        loadEmergencyHistory(userData, users)
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router])

  const loadEmergencyHistory = (userData: any, users: any[]) => {
    // Get emergency history from localStorage
    const emergencyHistory = JSON.parse(localStorage.getItem("emergencyHistory") || "{}")
    const currentEmergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")

    // Process sent alerts (alerts sent by current user)
    const userSentAlerts: any[] = []

    // Check if user has any emergency history
    if (emergencyHistory[userData.id]) {
      // Convert to array if it's not already
      const userEmergencies = Array.isArray(emergencyHistory[userData.id])
        ? emergencyHistory[userData.id]
        : [emergencyHistory[userData.id]]

      // Add all alerts to the array
      userEmergencies.forEach((alert: any) => {
        userSentAlerts.push({
          ...alert,
          userId: userData.id,
          userName: userData.fullName,
        })
      })
    }

    // Add current emergency if active
    if (currentEmergencies[userData.id]) {
      userSentAlerts.push({
        ...currentEmergencies[userData.id],
        userId: userData.id,
        userName: userData.fullName,
      })
    }

    // Sort by timestamp (newest first)
    userSentAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setSentAlerts(userSentAlerts)

    // Process received alerts (alerts sent by trusted contacts)
    const userReceivedAlerts: any[] = []
    const trustedContacts = userData.trustedContacts || []

    // For each trusted contact
    for (const contactId of trustedContacts) {
      // Check emergency history
      if (emergencyHistory[contactId]) {
        const contactUser = users.find((u) => u.id === contactId)
        if (contactUser) {
          // Convert to array if it's not already
          const contactEmergencies = Array.isArray(emergencyHistory[contactId])
            ? emergencyHistory[contactId]
            : [emergencyHistory[contactId]]

          // Add all alerts to the array
          contactEmergencies.forEach((alert: any) => {
            userReceivedAlerts.push({
              ...alert,
              userId: contactId,
              userName: contactUser.fullName,
            })
          })
        }
      }

      // Check current emergencies
      if (currentEmergencies[contactId]) {
        const contactUser = users.find((u) => u.id === contactId)
        if (contactUser) {
          userReceivedAlerts.push({
            ...currentEmergencies[contactId],
            userId: contactId,
            userName: contactUser.fullName,
          })
        }
      }
    }

    // Sort by timestamp (newest first)
    userReceivedAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setReceivedAlerts(userReceivedAlerts)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getStatusBadge = (emergency: any) => {
    if (emergency.active) {
      return emergency.doubtMode ? (
        <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Doubt</span>
      ) : (
        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Active</span>
      )
    } else if (emergency.cancelledAt) {
      return emergency.wasRealEmergency ? (
        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Resolved</span>
      ) : (
        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">False Alarm</span>
      )
    } else {
      return <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">Inactive</span>
    }
  }

  const toggleAudioExpand = (alertId: string) => {
    if (expandedAudio === alertId) {
      setExpandedAudio(null)
    } else {
      setExpandedAudio(alertId)
    }
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center py-4">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-pink-700">Emergency History</h1>
      </header>

      <Tabs defaultValue="received" className="w-full flex-1">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="received">Received Alerts</TabsTrigger>
          <TabsTrigger value="sent">Sent Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedAlerts.length > 0 ? (
            receivedAlerts.map((alert, index) => (
              <Card
                key={`${alert.userId}-${index}-${alert.timestamp}`}
                className={`overflow-hidden ${alert.doubtMode ? "border-yellow-200" : "border-red-200"}`}
              >
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`rounded-full p-2 mt-1 ${alert.doubtMode ? "bg-yellow-500" : "bg-red-500"}`}>
                          {alert.doubtMode ? (
                            <AlertCircle className="h-4 w-4 text-white" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className={`font-bold mr-2 ${alert.doubtMode ? "text-yellow-700" : "text-red-700"}`}>
                              {alert.doubtMode ? "DOUBT SITUATION" : "EMERGENCY ALERT"}
                            </h3>
                            {getStatusBadge(alert)}
                          </div>
                          <p className="text-sm text-gray-700">
                            {alert.doubtMode
                              ? `${alert.userName} reported a suspicious situation`
                              : `${alert.userName} needed help`}
                          </p>
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatDate(alert.timestamp)}</span>
                          </div>
                          {alert.location && (
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>
                                {alert.location[0].toFixed(6)}, {alert.location[1].toFixed(6)}
                              </span>
                            </div>
                          )}
                          {alert.audioChunks && alert.audioChunks.length > 0 && (
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Mic className="h-3 w-3 mr-1" />
                              <span
                                className="cursor-pointer hover:text-pink-500"
                                onClick={() => toggleAudioExpand(`${alert.userId}-${index}`)}
                              >
                                {alert.audioChunks.length} audio recordings{" "}
                                {expandedAudio === `${alert.userId}-${index}` ? "(hide)" : "(show)"}
                              </span>
                            </div>
                          )}
                          {alert.cancelledAt && (
                            <div className="mt-1">
                              <div className="text-xs text-yellow-600">
                                Cancelled at {formatDate(alert.cancelledAt)}
                              </div>
                              {alert.cancellationReason && (
                                <div className="flex items-center mt-1">
                                  {alert.wasRealEmergency ? (
                                    <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                  )}
                                  <p className="text-xs font-medium">{alert.cancellationReason}</p>
                                </div>
                              )}
                              {alert.emergencyType && (
                                <div className="flex items-center mt-1">
                                  <Tag className="h-3 w-3 text-pink-500 mr-1" />
                                  <span className="text-xs font-medium text-pink-700">{alert.emergencyType}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {expandedAudio === `${alert.userId}-${index}` &&
                      alert.audioChunks &&
                      alert.audioChunks.length > 0 && (
                        <div className="mt-2 p-3 bg-gray-50 border-t border-b border-gray-200">
                          <AudioPlayer
                            audioChunks={alert.audioChunks}
                            isLive={alert.active && alert.liveStreamActive}
                            latestTimestamp={alert.latestAudioChunk?.timestamp}
                          />
                        </div>
                      )}
                  </div>
                  <div className="bg-gray-50 p-2 border-t border-gray-200">
                    <Link href={`/emergency-track/${alert.userId}`}>
                      <Button
                        size="sm"
                        className={`w-full ${
                          alert.doubtMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-500 hover:bg-red-600"
                        }`}
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No received emergency alerts in your history</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentAlerts.length > 0 ? (
            sentAlerts.map((alert, index) => (
              <Card
                key={`sent-${index}-${alert.timestamp}`}
                className={`overflow-hidden ${alert.doubtMode ? "border-yellow-200" : "border-pink-200"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className={`rounded-full p-2 mt-1 ${alert.doubtMode ? "bg-yellow-500" : "bg-pink-500"}`}>
                        {alert.doubtMode ? (
                          <AlertCircle className="h-4 w-4 text-white" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className={`font-bold mr-2 ${alert.doubtMode ? "text-yellow-700" : "text-pink-700"}`}>
                            {alert.doubtMode ? "YOUR DOUBT REPORT" : "YOUR ALERT"}
                          </h3>
                          {getStatusBadge(alert)}
                        </div>
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{formatDate(alert.timestamp)}</span>
                        </div>
                        {alert.location && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            <span>
                              {alert.location[0].toFixed(6)}, {alert.location[1].toFixed(6)}
                            </span>
                          </div>
                        )}
                        {alert.audioChunks && alert.audioChunks.length > 0 && (
                          <div className="flex items-center mt-1 text-xs text-gray-500">
                            <Mic className="h-3 w-3 mr-1" />
                            <span
                              className="cursor-pointer hover:text-pink-500"
                              onClick={() => toggleAudioExpand(`sent-${index}`)}
                            >
                              {alert.audioChunks.length} audio recordings{" "}
                              {expandedAudio === `sent-${index}` ? "(hide)" : "(show)"}
                            </span>
                          </div>
                        )}
                        {alert.cancelledAt && (
                          <div className="mt-1">
                            <div className="text-xs text-yellow-600">Cancelled at {formatDate(alert.cancelledAt)}</div>
                            {alert.cancellationReason && (
                              <div className="flex items-center mt-1">
                                {alert.wasRealEmergency ? (
                                  <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                                ) : (
                                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                                )}
                                <p className="text-xs font-medium">{alert.cancellationReason}</p>
                              </div>
                            )}
                            {alert.emergencyType && (
                              <div className="flex items-center mt-1">
                                <Tag className="h-3 w-3 text-pink-500 mr-1" />
                                <span className="text-xs font-medium text-pink-700">{alert.emergencyType}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {expandedAudio === `sent-${index}` && alert.audioChunks && alert.audioChunks.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50 border rounded-md">
                      <AudioPlayer
                        audioChunks={alert.audioChunks}
                        isLive={alert.active && alert.liveStreamActive}
                        latestTimestamp={alert.latestAudioChunk?.timestamp}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't sent any emergency alerts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
