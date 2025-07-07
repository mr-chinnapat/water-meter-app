import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ระบบนำทางอ่านมาตรน้ำ | Water Meter Reading Navigation",
  description: "ระบบนำทางสำหรับการอ่านมาตรน้ำ พร้อมการจัดการข้อมูลและนำทางด้วย Google Maps",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
