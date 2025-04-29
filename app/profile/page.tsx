"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, LogOut } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    city: "",
    hasBracelet: false,
  })
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Get current user
    const currentUser = localStorage.getItem("safetyUser")
    if (!currentUser) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(currentUser)
    setUser(userData)
    setFormData({
      fullName: userData.fullName || "",
      email: userData.email || "",
      phoneNumber: userData.phoneNumber || "",
      city: userData.city || "",
      hasBracelet: userData.hasBracelet || false,
    })
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, hasBracelet: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return

    // Update user in local storage
    const updatedUser = { ...user, ...formData }
    localStorage.setItem("safetyUser", JSON.stringify(updatedUser))

    // Update user in users array
    const users = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
    const updatedUsers = users.map((u: any) => (u.id === user.id ? updatedUser : u))
    localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers))

    setUser(updatedUser)
    setMessage("Profile updated successfully")

    // Clear message after 3 seconds
    setTimeout(() => {
      setMessage("")
    }, 3000)
  }

  const handleLogout = () => {
    localStorage.removeItem("safetyUser")
    router.push("/login")
  }

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-pink-700">Profile</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-500">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-pink-700">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={formData.city} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-pink-700">Device Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="bracelet-status">SafeGuard Bracelet</Label>
                  <p className="text-sm text-gray-500">Do you have a SafeGuard bracelet?</p>
                </div>
                <Switch id="bracelet-status" checked={formData.hasBracelet} onCheckedChange={handleToggle} />
              </div>
            </CardContent>
          </Card>

          {message && <div className="bg-green-100 text-green-700 p-3 rounded-md text-center">{message}</div>}

          <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  )
}
