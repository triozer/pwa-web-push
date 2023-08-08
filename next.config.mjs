import withPWAInit from "@ducanh2912/next-pwa"
import { config } from "dotenv"

config()

const withPWA = withPWAInit({
  dest: "public",
})

export default withPWA({})
