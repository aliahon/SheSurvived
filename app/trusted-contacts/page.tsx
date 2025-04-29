"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Users, UserPlus, X, ArrowLeft, Search } from "lucide-react"

export default function TrustedContactsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [contacts, setContacts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
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

    // Get trusted contacts
    if (userData.trustedContacts && userData.trustedContacts.length > 0) {
      const userContacts = users.filter((u: any) => userData.trustedContacts.includes(u.id))
      setContacts(userContacts)
    }
  }, [router])

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search term is empty, show all users except current user and already added contacts
      const results = allUsers.filter((u: any) => u.id !== user.id && !contacts.some((contact) => contact.id === u.id))
      setSearchResults(results)
      return
    }

    // Filter users by name or email
    const results = allUsers.filter(
      (u: any) =>
        (u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        u.id !== user.id &&
        !contacts.some((contact) => contact.id === u.id),
    )

    setSearchResults(results)
  }

  const addContact = (contactId: string) => {
    if (!user) return

    const contactUser = allUsers.find((u: any) => u.id === contactId)
    if (!contactUser) return

    // Update current user's trusted contacts
    const updatedUser = {
      ...user,
      trustedContacts: [...(user.trustedContacts || []), contactId],
    }

    // Update contact's trustedBy list
    const updatedContactUser = {
      ...contactUser,
      trustedBy: [...(contactUser.trustedBy || []), user.id],
    }

    // Update in local storage
    const updatedUsers = allUsers.map((u: any) => {
      if (u.id === user.id) return updatedUser
      if (u.id === contactId) return updatedContactUser
      return u
    })

    localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers))
    localStorage.setItem("safetyUser", JSON.stringify(updatedUser))

    // Update state
    setUser(updatedUser)
    setContacts([...contacts, contactUser])
    setSearchResults(searchResults.filter((r) => r.id !== contactId))
    setAllUsers(updatedUsers)
  }

  const removeContact = (contactId: string) => {
    if (!user) return

    const contactUser = allUsers.find((u: any) => u.id === contactId)
    if (!contactUser) return

    // Update current user's trusted contacts
    const updatedUser = {
      ...user,
      trustedContacts: (user.trustedContacts || []).filter((id: string) => id !== contactId),
    }

    // Update contact's trustedBy list
    const updatedContactUser = {
      ...contactUser,
      trustedBy: (contactUser.trustedBy || []).filter((id: string) => id !== user.id),
    }

    // Update in local storage
    const updatedUsers = allUsers.map((u: any) => {
      if (u.id === user.id) return updatedUser
      if (u.id === contactId) return updatedContactUser
      return u
    })

    localStorage.setItem("safetyUsers", JSON.stringify(updatedUsers))
    localStorage.setItem("safetyUser", JSON.stringify(updatedUser))

    // Update state
    setUser(updatedUser)
    setContacts(contacts.filter((c) => c.id !== contactId))
    setAllUsers(updatedUsers)
  }

  useEffect(() => {
    // When search is shown, automatically show all users
    if (showSearch) {
      handleSearch()
    }
  }, [showSearch])

  if (!user) return null

  return (
    <div className="container max-w-md mx-auto px-4 py-4 min-h-screen flex flex-col">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-pink-700">Trusted Contacts</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)} className="text-pink-500">
          {showSearch ? <X className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </Button>
      </header>

      <div className="flex-1">
        {showSearch && (
          <div className="mb-6 space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyUp={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} className="bg-pink-500 hover:bg-pink-600">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-500">
                  {searchTerm ? "Search Results" : "All Available Users"}
                </h3>
                {searchResults.map((result) => (
                  <Card key={result.id} className="bg-pink-50 border-pink-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{result.fullName}</h3>
                          <p className="text-sm text-gray-500">{result.email}</p>
                          <p className="text-xs text-gray-400">{result.city}</p>
                        </div>
                        <Button
                          onClick={() => addContact(result.id)}
                          size="sm"
                          className="bg-pink-500 hover:bg-pink-600"
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : searchTerm ? (
              <p className="text-sm text-gray-500 text-center py-2">No users found</p>
            ) : null}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-pink-500 mr-2" />
            <h2 className="text-lg font-medium">Your Trusted Contacts</h2>
          </div>

          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <Card key={contact.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{contact.fullName}</h3>
                        <p className="text-sm text-gray-500">{contact.email}</p>
                        <p className="text-xs text-gray-400">{contact.city}</p>
                      </div>
                      <Button
                        onClick={() => removeContact(contact.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't added any trusted contacts yet</p>
              <Button onClick={() => setShowSearch(true)} className="mt-4 bg-pink-500 hover:bg-pink-600">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Contacts
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
