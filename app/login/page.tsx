"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import SheSurvivedLogo from "@/components/she-survived-logo"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Simple validation
    if (!email || !password) {
      setError("Please fill in all fields")
      return
    }

    // Check if user exists in local storage
    const users = JSON.parse(localStorage.getItem("safetyUsers") || "[]")
    const user = users.find((u: any) => u.email === email)

    if (!user) {
      setError("User not found")
      return
    }

    // In a real app, you would hash and properly compare passwords
    if (user.password !== password) {
      setError("Invalid password")
      return
    }

    // Store logged in user
    localStorage.setItem("safetyUser", JSON.stringify(user))
    router.push("/dashboard")
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-screen">
      <div className="flex flex-col items-center mb-8">
        <SheSurvivedLogo size="lg" />
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-pink-700">Login</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600">
              Login
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-pink-500 hover:underline">
              Register
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
