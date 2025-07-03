import React from "react";
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientRoot from "@/components/ClientRoot"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MohStore",
  description: "Top up points easily, purchase in-game items, and manage your castles and orders.",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={inter.className}>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
