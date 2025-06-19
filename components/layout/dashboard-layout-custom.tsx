"use client"

import { type ReactNode, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar-named-export" // Import from our new file
import { Header } from "./Header"

type DashboardLayoutProps = {
  children: ReactNode
  userRole: "admin" | "customer" | "seller"
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar userRole={userRole} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header userRole={userRole} onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
