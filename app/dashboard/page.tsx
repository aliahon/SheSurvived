"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Bell, Users, Map, User, LogOut, AlertTriangle, AlertCircle, History } from "lucide-react"
import Link from "next/link"
import EmergencyNotification from "@/components/emergency-notification"
import SheSurvivedLogo from "@/components/she-survived-logo"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [emergencies, setEmergencies] = useState<any[]>([])

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(JSON.parse(currentUser))

    // Check for emergencies
    const checkEmergencies = () => {
      const userData = JSON.parse(localStorage.getItem("safetyUser") || "{}")
      const allEmergencies = JSON.parse(localStorage.getItem("emergencies") || "{}")
      const allUsers = JSON.parse(localStorage.getItem("safetyUsers") || "[]")

      // Filter emergencies for trusted contacts of the current user
      const trustedContacts = userData.trustedContacts || []
      const activeEmergencies = []

      for (const contactId of trustedContacts) {
        if (allEmergencies[contactId] && allEmergencies[contactId].active) {
          const contactUser = allUsers.find((u: any) => u.id === contactId)
          if (contactUser) {
            activeEmergencies.push({
              ...allEmergencies[contactId],
              userId: contactId,
              userName: contactUser.fullName,
            })
          }
        }
      }

      setEmergencies(activeEmergencies)
    }

    // Check immediately and then every 5 seconds
    checkEmergencies()
    const interval = setInterval(checkEmergencies, 5000)

    // Set up event listener for storage changes (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "emergencies" || e.key === "safetyUser" || e.key === "safetyUsers") {
        checkEmergencies()
      }
    }

    window.addEventListener("storage", handleStorageChange)

    return () => {
      clearInterval(interval)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("safetyUser")
    router.push("/login")
  }

  const dismissEmergency = (userId: string) => {
    setEmergencies(emergencies.filter((e) => e.userId !== userId))
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <SheSurvivedLogo size="sm" withText={true} />
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <Tabs defaultValue="home" className="w-full flex flex-col flex-1">
        <TabsContent value="home" className="mt-0 flex-1">
          <div className="space-y-4 py-4">
            {emergencies.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-red-500">Emergency Alerts</h3>
                {emergencies.map((emergency) => (
                  <EmergencyNotification
                    key={emergency.userId}
                    emergency={emergency}
                    onDismiss={() => dismissEmergency(emergency.userId)}
                  />
                ))}
              </div>
            )}

            <Card className="bg-pink-100 border-pink-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="bg-pink-500 rounded-full p-3">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium">Welcome, {user.fullName}</h3>
                    <p className="text-sm text-gray-500">{user.hasBracelet ? "Bracelet User" : "Trusted Contact"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {user.hasBracelet && !user.braceletVerified && (
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-yellow-700">Bracelet Not Verified</h3>
                      <p className="text-sm text-yellow-600 mt-1">
                        Your bracelet needs to be verified before you can use emergency features.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-xs h-8"
                        onClick={() => router.push("/bracelet-verification")}
                      >
                        Verify Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {user.hasBracelet && user.braceletVerified && (
              <Link href="/alarm">
                <Button className="w-full h-20 bg-pink-500 hover:bg-pink-600 flex items-center justify-center space-x-3">
                  <AlertTriangle className="h-6 w-6" />
                  <span className="text-lg font-medium">Emergency Alert</span>
                </Button>
              </Link>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Link href="/trusted-contacts">
                <Card className="hover:bg-pink-50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                    <Users className="h-8 w-8 text-pink-500 mb-2" />
                    <h3 className="font-medium text-center">Trusted Contacts</h3>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/trusted-by">
                <Card className="hover:bg-pink-50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                    <Bell className="h-8 w-8 text-pink-500 mb-2" />
                    <h3 className="font-medium text-center">People Trusting You</h3>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/safe-walk">
                <Card className="hover:bg-pink-50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                    <Map className="h-8 w-8 text-pink-500 mb-2" />
                    <h3 className="font-medium text-center">Safety Map</h3>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/emergency-history">
                <Card className="hover:bg-pink-50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center justify-center h-32">
                    <History className="h-8 w-8 text-pink-500 mb-2" />
                    <h3 className="font-medium text-center">Alert History</h3>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </TabsContent>

        <footer className="py-4 mt-auto">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="home" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
              <div className="flex flex-col items-center">
                <Shield className="h-5 w-5" />
                <span className="text-xs mt-1">Home</span>
              </div>
            </TabsTrigger>
            <TabsTrigger value="contacts" asChild>
              <Link href="/trusted-contacts" className="flex flex-col items-center justify-center text-gray-500 py-2">
                <Users className="h-5 w-5" />
                <span className="text-xs mt-1">Contacts</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="routes" asChild>
              <Link href="/safe-walk" className="flex flex-col items-center justify-center text-gray-500 py-2">
                <Map className="h-5 w-5" />
                <span className="text-xs mt-1">Map</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="profile" asChild>
              <Link href="/profile" className="flex flex-col items-center justify-center text-gray-500 py-2">
                <User className="h-5 w-5" />
                <span className="text-xs mt-1">Profile</span>
              </Link>
            </TabsTrigger>
          </TabsList>
        </footer>
      </Tabs>
    </div>
  )
}
