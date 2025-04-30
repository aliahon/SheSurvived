"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, AlertTriangle, MapPin } from "lucide-react"
import Link from "next/link"

export default function EmergencyHistoryPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [sentAlerts, setSentAlerts] = useState<any[]>([])
  const [receivedAlerts, setReceivedAlerts] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])

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

    // Combine current emergencies with history
    const allEmergencies = { ...emergencyHistory, ...currentEmergencies }

    // Save combined emergencies back to history
    localStorage.setItem("emergencyHistory", JSON.stringify(allEmergencies))

    // Filter sent alerts (alerts sent by current user)
    const userSentAlerts = []
    if (allEmergencies[userData.id]) {
      const alertsArray = Array.isArray(allEmergencies[userData.id])
        ? allEmergencies[userData.id]
        : [allEmergencies[userData.id]]

      for (const alert of alertsArray) {
        userSentAlerts.push({
          ...alert,
          userId: userData.id,
          userName: userData.fullName,
        })
      }
    }

    // Sort by timestamp (newest first)
    userSentAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    setSentAlerts(userSentAlerts)

    // Filter received alerts (alerts sent by trusted contacts)
    const userReceivedAlerts = []
    const trustedContacts = userData.trustedContacts || []

    for (const contactId of trustedContacts) {
      if (allEmergencies[contactId]) {
        const contactUser = users.find((u) => u.id === contactId)
        if (contactUser) {
          const alertsArray = Array.isArray(allEmergencies[contactId])
            ? allEmergencies[contactId]
            : [allEmergencies[contactId]]

          for (const alert of alertsArray) {
            userReceivedAlerts.push({
              ...alert,
              userId: contactId,
              userName: contactUser.fullName,
            })
          }
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
      return <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">Active</span>
    } else if (emergency.cancelledAt) {
      return <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Cancelled</span>
    } else {
      return <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">Resolved</span>
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
              <Card key={`${alert.userId}-${index}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="bg-red-500 rounded-full p-2 mt-1">
                          <AlertTriangle className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-bold text-red-700 mr-2">EMERGENCY ALERT</h3>
                            {getStatusBadge(alert)}
                          </div>
                          <p className="text-sm text-gray-700">{alert.userName} needed help</p>
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
                          {alert.cancelledAt && (
                            <div className="text-xs text-yellow-600 mt-1">
                              Cancelled at {formatDate(alert.cancelledAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {alert.active && (
                    <div className="bg-gray-50 p-2 border-t border-gray-200">
                      <Link href={`/emergency-track/${alert.userId}`}>
                        <Button size="sm" className="w-full bg-red-500 hover:bg-red-600">
                          Track Location
                        </Button>
                      </Link>
                    </div>
                  )}
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
              <Card key={`sent-${index}`} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="bg-pink-500 rounded-full p-2 mt-1">
                        <AlertTriangle className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-bold text-pink-700 mr-2">YOUR ALERT</h3>
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
                        {alert.cancelledAt && (
                          <div className="text-xs text-yellow-600 mt-1">
                            Cancelled at {formatDate(alert.cancelledAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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
