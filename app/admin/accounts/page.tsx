"use client"

import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getUsers, updateUserRole, createUser } from "@/app/actions/users"

type User = {
  id: number
  username: string
  email: string
  role: "admin" | "customer" | "seller"
  points: number
  reserved_points: number
  whatsapp_number?: string
  created_at: string
}

export default function AccountManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true)
        const usersData = await getUsers()
        setUsers(usersData)
      } catch (error) {
        console.error("Error loading users:", error)
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadUsers()
  }, [toast])

  async function handleCreateUser(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await createUser(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "User created successfully",
        })

        // Reload users
        const usersData = await getUsers()
        setUsers(usersData)
        setIsCreateDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create user",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Create user error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRoleUpdate(userId: number, newRole: "customer" | "seller" | "admin") {
    setIsLoading(true)

    try {
      const result = await updateUserRole(userId, newRole)

      if (result.success) {
        toast({
          title: "Success",
          description: "User role updated successfully",
        })

        // Update the user in the list
        setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
        setIsEditDialogOpen(false)
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to update user role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Update role error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "seller":
        return "bg-blue-100 text-blue-800"
      case "customer":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Account Management</h1>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create New Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User Account</DialogTitle>
                <DialogDescription>Create a new user account with specified role and details.</DialogDescription>
              </DialogHeader>

              <form action={handleCreateUser} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                  <Input id="whatsappNumber" name="whatsappNumber" placeholder="+1234567890" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue="customer">
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Account"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading accounts...</p>
          </div>
        ) : users.length > 0 ? (
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {user.username}
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>{user.email}</CardDescription>
                    </div>
                    <Dialog
                      open={isEditDialogOpen && selectedUser?.id === user.id}
                      onOpenChange={(open) => {
                        setIsEditDialogOpen(open)
                        if (open) setSelectedUser(user)
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit User Account</DialogTitle>
                          <DialogDescription>Update user information and role for {user.username}</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Username</Label>
                              <p className="text-sm text-gray-600">{user.username}</p>
                            </div>
                            <div>
                              <Label>Email</Label>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Points</Label>
                              <p className="text-sm text-gray-600">{user.points}</p>
                            </div>
                            <div>
                              <Label>Reserved Points</Label>
                              <p className="text-sm text-gray-600">{user.reserved_points}</p>
                            </div>
                          </div>

                          {user.whatsapp_number && (
                            <div>
                              <Label>WhatsApp Number</Label>
                              <p className="text-sm text-gray-600">{user.whatsapp_number}</p>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="newRole">Change Role</Label>
                            <Select
                              defaultValue={user.role}
                              onValueChange={(value: "customer" | "seller" | "admin") => {
                                handleRoleUpdate(user.id, value)
                              }}
                            >
                              <SelectTrigger id="newRole">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Points:</span> {user.points}
                    </div>
                    <div>
                      <span className="font-medium">Reserved:</span> {user.reserved_points}
                    </div>
                    <div>
                      <span className="font-medium">WhatsApp:</span> {user.whatsapp_number || "Not provided"}
                    </div>
                    <div>
                      <span className="font-medium">Joined:</span> {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No accounts found</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
