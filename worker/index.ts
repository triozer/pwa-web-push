declare const self: ServiceWorkerGlobalScope

// --- Utils ---

async function getActiveClients() {
  return self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  })
}

async function checkNotificationCount(
  notifications: Notification[],
  tag: string,
  empty: boolean
) {
  console.log(`Notifications with tag ${tag} count is ${notifications.length}`)

  // We should only have zero or one notifications with the same tag.
  if (empty && notifications.length !== 0) {
    console.error(
      `Expected to have exactly 0 notifications with the tag ${tag}, got ${notifications.length}.`
    )
  } else if (notifications.length > 1) {
    console.error(
      `Expected to have 0 or 1 notifications with the tag ${tag}, got ${notifications.length}.`
    )
  }
}

async function checkFocusedURL(
  focusedClient: WindowClient | null,
  route: string
) {
  if (!focusedClient) {
    console.error(
      `This should not happen as we should have focused on the page.`
    )
    return
  }

  if (focusedClient.url !== `${self.location.origin}${route}`) {
    console.error(
      `Expected to be on the route "${route}" focused, got ${focusedClient.url}.`
    )
  }
}

async function receivePushNotification(event: PushEvent) {
  const data = event.data?.json()
  console.log("Received push notification", data)

  const { body, tag, forceClose, showIfFocused } = data

  if (!showIfFocused) {
    // As per https://web.dev/push-notifications-common-notification-patterns/#merging-notifications,
    // we should be able to safely ignore push notifications if the page is open and focused.
    const clients = await getActiveClients()

    console.log(`Active clients ${clients.length}`)
    for (const client of clients) {
      console.log(`Checking client ${client.id}`, {
        focused: client.focused,
        visibilityState: client.visibilityState,
      })

      if (client.focused) {
        console.log(
          `Expecting to have no notification as the page is already focused.`
        )
        // Returning here should end everything well. But on WebKit, we have the following error:
        // "Push event ended without showing any notification may trigger removal of the push subscription."
        // So we need to show a notification to avoid this error, otherwise after 3 tries, the
        // subscription is removed.
        return
      }
    }
  }

  // Step 4 of the show steps spec (https://notifications.spec.whatwg.org/#show-steps),
  // which manages notification replacement, is currently unsupported in WebKit due to
  // a known issue (https://bugs.webkit.org/show_bug.cgi?id=258922).
  //
  // Manually closing the notification does not remove it in the notification center
  // but it does remove it from the list of notifications returned by getNotifications.

  const oldNotifications = await self.registration.getNotifications({ tag })

  await checkNotificationCount(oldNotifications, tag, false)

  if (forceClose) {
    oldNotifications.forEach((notification) => notification.close())

    await checkNotificationCount(
      await self.registration.getNotifications({ tag }),
      tag,
      true
    )
  }

  return self.registration.showNotification("New notification", {
    body,
    tag,
  })
}

async function openPushNotification(event: NotificationEvent) {
  event.notification.close() // Here the close works fine. But I guess we don't really need it as it's managed by the platform.

  const clients = await getActiveClients()

  console.log(`Active clients ${clients.length}`)

  // If the page is already open and focused, we don't need to open a new one.
  // We can just change the URL and focus on the page.
  // On Safari (macOS), the page is focused while we're on it, so we need to check if the page is also visible.

  if (clients.length > 0) {
    for (const client of clients) {
      const focused = client.focused
      const visibilityState = client.visibilityState

      console.log(`Checking client ${client.id}`, {
        focused,
        visibilityState,
      })

      if (!focused || visibilityState === "hidden") {
        console.log(`Focusing on the page as it's not focused / visible.`)
        await client.focus()
      }

      console.log(`Navigating to the page.`)
      return checkFocusedURL(await client.navigate("/hi"), "/hi")
    }
  }

  // On a PWA on iOS, if the app was closed and we open it from the notification,
  // the page opens the "start_url" instead of the URL we want.  await self.clients.openWindow("/hi")
  await self.clients.claim()

  // Because we opened the app, we should have only one client.
  let focusedClient = (await getActiveClients())[0]

  if (focusedClient?.url !== `${self.location.origin}/hi`) {
    console.log(`Navigating to the page after opening the app.`)
    await focusedClient?.navigate("/hi")
  }

  await checkFocusedURL(focusedClient, "/hi")
}

self.addEventListener("push", (event) =>
  event.waitUntil(receivePushNotification(event))
)
self.addEventListener("notificationclick", (event) =>
  event.waitUntil(openPushNotification(event))
)

export {}
