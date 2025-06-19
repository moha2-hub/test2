"use client"

import { useEffect, useState } from "react"
import { getUsers, updateUserRole, createUser } from "@/app/actions/users"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type User = {
  id: number
  username: string
  email: string
  role: "admin" | "customer" | "seller"
  points: number
  reserved_points: number
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"customer" | "seller" | "admin">("customer")
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

  async function handleRoleUpdate() {
    if (!selectedUser) return

    setIsLoading(true)

    try {
      const result = await updateUserRole(selectedUser.id, newRole)

      if (result.success) {
        toast({
          title: "Success",
          description: `User role updated successfully`,
        })

        // Update the user in the list
        setUsers(users.map((user) => (user.id === selectedUser.id ? { ...user, role: newRole } : user)))
        setIsRoleDialogOpen(false)
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

  async function handleCreateUser(formData: FormData) {
    setIsLoading(true)

    try {
      const result = await createUser(formData)

      if (result.success) {
        toast({
          title: "Success",
          description: "User created successfully",
        })

        // Reload users to include the new one
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Create a new user with a specific role. Only admins can create users with seller or admin roles.
              </DialogDescription>
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
                  {isLoading ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading users...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{user.username}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "seller"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      Points: {user.points} | Reserved: {user.reserved_points}
                    </p>
                    <p className="text-sm text-gray-500">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                  </div>

                  <Dialog
                    open={isRoleDialogOpen && selectedUser?.id === user.id}
                    onOpenChange={(open) => {
                      setIsRoleDialogOpen(open)
                      if (open) {
                        setSelectedUser(user)
                        setNewRole(user.role)
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Change Role
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change User Role</DialogTitle>
                        <DialogDescription>Update the role for {user.username}</DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="role">Select New Role</Label>
                          <Select
                            value={newRole}
                            onValueChange={(value: "customer" | "seller" | "admin") => setNewRole(value)}
                          >
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
                      </div>

                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleRoleUpdate} disabled={isLoading}>
                          {isLoading ? "Updating..." : "Update Role"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No users found</p>
        </div>
      )}
    </div>
  )
}
