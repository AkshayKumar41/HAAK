import { MainLayout } from "@/components/layout/main-layout"
import { Dashboard } from "@/components/pages/dashboard"

export const metadata = {
  title: "Live Time Dashboard",
  description: "Event management dashboard",
}

export default function Home() {
  return (
      <Dashboard />
  )
}
