"use client"
import { Card } from "@/components/ui/card"

interface Event {
  id: number
  title: string
  time?: string
  location?: string
  group?: string
  image?: string
  date: Date
  color?: string
  startTime?: string
}

interface EventSidebarProps {
  events: Event[]
  currentDate: Date
}

export function EventSidebar({ events, currentDate }: EventSidebarProps) {
  const upcomingEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 4)

  const formatEventDate = (event: Event) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const eventDay = new Date(event.date)
    eventDay.setHours(0, 0, 0, 0)
    
    const diffTime = eventDay.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    // Use time, startTime, or default
    let eventTime = event.time
    if (!eventTime && event.startTime) {
      // Convert 24-hour format to 12-hour format
      const [hours, minutes] = event.startTime.split(":").map(Number)
      const period = hours >= 12 ? "PM" : "AM"
      const displayHours = hours % 12 || 12
      const displayMinutes = minutes.toString().padStart(2, "0")
      eventTime = `${displayHours}:${displayMinutes} ${period}`
    }
    eventTime = eventTime || "11:19 AM"

    if (diffDays === 0) {
      return `Today ${eventTime}`
    } else if (diffDays === 1) {
      return `Tomorrow ${eventTime}`
    } else {
      const day = event.date.getDate()
      const month = event.date.toLocaleDateString("en-US", { month: "long" })
      const year = event.date.getFullYear()
      // Format time for full date display (e.g., "5.00 PM")
      const formattedTime = eventTime.replace(":", ".").replace(/\s(AM|PM)/i, " $1")
      return `${day} ${month} ${year} at ${formattedTime}`
    }
  }

  return (
    <div className="w-72 bg-white border-r p-6 overflow-y-auto space-y-6">
      {/* Happening Soon */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Happening Soon</h2>
          <button className="text-sm text-muted-foreground hover:text-foreground">See all</button>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="px-3 py-1 rounded-full bg-pink-500 text-white text-xs font-medium hover:bg-pink-600">
            Now
          </button>
          <button className="px-3 py-1 rounded-full border border-muted bg-white text-xs font-medium hover:bg-muted">
            Today
          </button>
          <button className="px-3 py-1 rounded-full border border-muted bg-white text-xs font-medium hover:bg-muted">
            This week
          </button>
        </div>

        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="p-3 hover:bg-muted cursor-pointer transition">
              <div className="flex gap-3">
                {event.image && (
                  <img
                    src={event.image || "/placeholder.svg"}
                    alt={event.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-1">{event.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatEventDate(event)}
                  </p>
                  {event.location && <p className="text-xs text-muted-foreground mt-1">{event.location}</p>}
                  {event.group && <p className="text-xs text-muted-foreground mt-1">{event.group}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
