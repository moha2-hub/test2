"use client"

import React, { type ReactNode, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Store,
  LogOut,
  ShoppingBag,
  Package,
  Settings,
  Users,
  Home,
  Menu,
  Wallet,
  Castle,
  AlertTriangle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { LanguageToggle } from "@/components/language-toggle"

interface DashboardLayoutProps {
  userRole: "admin" | "seller" | "customer"
  children: ReactNode
}

/**
 * Returns the home href based on the user role
 */
function getHomeHref(role: DashboardLayoutProps["userRole"]) {
  switch (role) {
    case "admin":
      return "/admin"
    case "seller":
      return "/seller"
    case "customer":
      return "/customer"
    default:
      return "/"
  }
}

export function DashboardLayout({ userRole, children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNavOpen, setIsNavOpen] = useState(false)

  const handleLogout = () => {
    // Clear cookies
    document.cookie = "userId=;path=/;max-age=0"
    document.cookie = "userRole=;path=/;max-age=0"

    // Redirect to login page
    router.push("/login")
  }

  const navItems = [
    {
      href:
        userRole === "admin"
          ? "/admin"
          : userRole === "seller"
          ? "/seller"
          : "/customer",
      label: "Dashboard",
      icon: Home,
    },
    ...(userRole === "admin"
      ? [
          { href: "/admin/products", label: "Products", icon: Package },
          { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
          { href: "/admin/accounts", label: "Account Management", icon: Users },
          { href: "/admin/top-ups", label: "Top-ups", icon: Wallet },
          { href: "/admin/reclamations", label: "Reclamations", icon: AlertTriangle },
          { href: "/admin/settings", label: "Settings", icon: Settings },
        ]
      : userRole === "seller"
      ? [
          { href: "/seller/my-orders", label: "My Orders", icon: ShoppingBag },
          { href: "/seller/available-orders", label: "Available Orders", icon: Package },
          { href: "/seller/wallet", label: "Wallet", icon: Wallet },
          { href: "/seller/settings", label: "Settings", icon: Settings },
        ]
      : [
          { href: "/customer/shop", label: "Shop", icon: Package },
          { href: "/customer/orders", label: "My Orders", icon: ShoppingBag },
          { href: "/customer/castles", label: "My Castles", icon: Castle },
          { href: "/customer/wallet", label: "Wallet", icon: Wallet },
          { href: "/customer/reclamations", label: "Reclamations", icon: AlertTriangle },
          { href: "/customer/settings", label: "Settings", icon: Settings },
        ]),
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <Link href={getHomeHref(userRole)} className="flex items-center gap-2 font-semibold text-lg">
          <Store className="h-6 w-6" />
          <span>MohStore</span>
        </Link>

        <nav className="hidden flex-1 md:flex">
          <ul className="flex flex-1 items-center gap-4 md:gap-6">
            {navItems.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <LanguageToggle />
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </header>

      {/* Mobile navigation */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="w-64 sm:w-72">
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold" onClick={() => setIsMobileMenuOpen(false)}>
              <Store className="h-6 w-6" />
              <span>MohStore</span>
            </Link>
          </div>
          <nav className="flex flex-col gap-4 py-4">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            <div className="mt-auto px-4 py-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  )
}
