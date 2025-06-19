"use client"

import type React from "react"
import { useState } from "react"
import { DashboardLayout } from "@/components/custom-dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { submitReclamation } from "@/app/actions/reclamations"
import { useToast } from "@/hooks/use-toast"

export default function ReclamationPage() {
  const [form, setForm] = useState({ orderId: "", subject: "", message: "" })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await submitReclamation(form.orderId, form.subject, form.message)

      if (result.success) {
        toast({
          title: "Success",
          description: "Your reclamation has been submitted successfully!",
        })
        setSubmitted(true)
        setForm({ orderId: "", subject: "", message: "" })
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to submit reclamation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting reclamation:", error)
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
    <DashboardLayout userRole="customer">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Submit a Reclamation</h1>

        <Card>
          <CardHeader>
            <CardTitle>Reclamation Form</CardTitle>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="bg-green-50 text-green-600 p-4 rounded-md">
                <p className="font-medium">Your reclamation has been submitted successfully!</p>
                <p className="mt-2">Our admin team will review your request and get back to you soon.</p>
                <Button className="mt-4" onClick={() => setSubmitted(false)}>
                  Submit Another Reclamation
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    name="orderId"
                    placeholder="Enter the order ID"
                    value={form.orderId}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Brief description of the issue"
                    value={form.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Detailed Description</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Please provide details about your issue"
                    value={form.message}
                    onChange={handleChange}
                    rows={5}
                    required
                  />
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Submitting..." : "Submit Reclamation"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
