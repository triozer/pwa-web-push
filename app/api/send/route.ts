import { NextResponse } from "next/server"
import webPush from "web-push"

export async function POST(req: Request) {
  if (
    !process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY ||
    !process.env.WEB_PUSH_EMAIL ||
    !process.env.WEB_PUSH_PRIVATE_KEY
  ) {
    throw new Error("Environment variables supplied not sufficient.")
  }

  const { subscription, isDelayed, payload } = await req.json()

  webPush.setVapidDetails(
    process.env.WEB_PUSH_EMAIL,
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY,
    process.env.WEB_PUSH_PRIVATE_KEY
  )

  try {
    if (isDelayed) {
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }
    await webPush.sendNotification(subscription, JSON.stringify(payload))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ success: false }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
