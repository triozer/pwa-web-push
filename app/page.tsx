"use client"

import { base64ToUint8Array, cn } from "@/lib/utils"
import { FormEvent, MouseEventHandler, useEffect, useState } from "react"

const Home = () => {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null)

  const [body, setBody] = useState("Hello world!")
  const [tag, setTag] = useState("hello")
  const [isDelayed, setIsDelayed] = useState(true)
  const [forceClose, setForceClose] = useState(false)
  const [showIfFocused, setShowIfFocused] = useState(false)

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      typeof window.workbox !== "undefined"
    ) {
      navigator.serviceWorker.ready.then((reg) => {
        if (!("pushManager" in reg)) {
          return
        }

        reg.pushManager.getSubscription().then((sub) => {
          if (
            sub &&
            !(
              sub.expirationTime &&
              Date.now() > sub.expirationTime - 5 * 60 * 1000
            )
          ) {
            setSubscription(sub)
            setIsSubscribed(true)
          }

          setRegistration(reg)
        })
      })
    }
  }, [])

  const subscribeButtonOnClick: MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    if (!registration) {
      console.error("No SW registration available.")
      return
    }

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(
        process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY!
      ),
    })

    setSubscription(sub)
    setIsSubscribed(true)
  }

  const unsubscribeButtonOnClick: MouseEventHandler<HTMLButtonElement> = async (
    event
  ) => {
    if (!subscription) {
      return
    }

    await subscription.unsubscribe()

    setSubscription(null)
    setIsSubscribed(false)
  }

  const sendNotification = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    await fetch("/api/send", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({
        subscription,
        isDelayed,
        payload: {
          body,
          tag,
          forceClose,
          showIfFocused,
        },
      }),
    })
  }

  return (
    <form
      className="flex flex-col gap-6 w-full p-10"
      onSubmit={(e) => sendNotification(e)}
    >
      <div className="flex gap-5">
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          )}
          onClick={subscribeButtonOnClick}
          disabled={isSubscribed}
        >
          Subscribe
        </button>
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={unsubscribeButtonOnClick}
          disabled={!isSubscribed}
        >
          Unsubscribe
        </button>
      </div>
      {isSubscribed && (
        <pre className="overflow-x-scroll">
          {JSON.stringify(subscription, null, 2)}
        </pre>
      )}
      <div>
        <label htmlFor="body" className="block mb-2 text-sm font-medium">
          Message
        </label>
        <input
          type="text"
          id="body"
          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="Enter a message"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="tag" className="block mb-2 text-sm font-medium">
          Tag
        </label>
        <input
          type="text"
          id="tag"
          className="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="Enter a tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          required
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="delay"
            defaultChecked={isDelayed}
            onChange={(e) => setIsDelayed(e.target.checked)}
          />
          <label htmlFor="delay" className="block text-sm font-medium">
            Receive notification after 5s
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="force-close"
            defaultChecked={forceClose}
            onChange={(e) => setForceClose(e.target.checked)}
          />
          <label htmlFor="force-close" className="block text-sm font-medium">
            Force close notifications
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="show-if-focused"
            defaultChecked={showIfFocused}
            onChange={(e) => setShowIfFocused(e.target.checked)}
          />
          <label
            htmlFor="show-if-focused"
            className="block text-sm font-medium"
          >
            Show notification if focused
          </label>
        </div>
      </div>
      <button
        type="submit"
        className={cn(
          "text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center",
          {
            "bg-gray-400 hover:bg-gray-400": !isSubscribed,
          }
        )}
        disabled={!isSubscribed}
      >
        Send notification
      </button>
    </form>
  )
}

export default Home
