import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

const APP_NAME = "Web Push"
const APP_DESCRIPTION = "Web Push Experiments"

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description: APP_DESCRIPTION,
  // manifest: "/manifest.json",
  icons: {
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="w-full h-full">
      <body
        className={cn(
          inter.className,
          "w-full h-full flex flex-col items-center justify-center"
        )}
      >
        {children}
      </body>
    </html>
  )
}
