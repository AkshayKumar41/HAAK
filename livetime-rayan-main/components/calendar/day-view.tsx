"use client"

import { useMemo } from "react"

interface Event {
  id: number
  title: string
  date: Date
  color: string
  startTime: string
  endTime: string
  location?: string
  group?: string
}

interface DayViewProps {
  currentDate: Date
  events: Event[]
}

const colorMap: Record<string, { bg: string; text: string; borderLeft: string }> = {
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-900",
    borderLeft: "border-l-4 border-l-purple-500",
  },
  blue: {
    bg: "bg-cyan-50",
    text: "text-cyan-900",
    borderLeft: "border-l-4 border-l-cyan-500",
  },
  cyan: {
    bg: "bg-cyan-50",
    text: "text-cyan-900",
    borderLeft: "border-l-4 border-l-cyan-500",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-900",
    borderLeft: "border-l-4 border-l-orange-500",
  },
  green: {
    bg: "bg-green-50",
    text: "text-green-900",
    borderLeft: "border-l-4 border-l-green-500",
  },
  pink: {
    bg: "bg-pink-50",
    text: "text-pink-900",
    borderLeft: "border-l-4 border-l-pink-500",
  },
}

export function DayView({ currentDate, events }: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = String(i).padStart(2, "0")
    return hour
  })

  const dayEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.date.getDate() === currentDate.getDate() &&
        event.date.getMonth() === currentDate.getMonth() &&
        event.date.getFullYear() === currentDate.getFullYear(),
    )
  }, [currentDate, events])

  const getEventPosition = (startTime: string) => {
    const [hours] = startTime.split(":").map(Number)
    return hours * 60
  }

  const getEventHeight = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number)
    const [endHour, endMin] = endTime.split(":").map(Number)
    const duration = endHour * 60 + endMin - (startHour * 60 + startMin)
    return Math.max(duration, 60)
  }

  // Get all events with their time positions
  const eventRanges = dayEvents.map((event) => ({
    ...event,
    top: getEventPosition(event.startTime),
    height: getEventHeight(event.startTime, event.endTime),
  }))

  return (
    <div className="p-4">
      <div className="text-xs font-semibold text-muted-foreground mb-4">TODAY</div>

      {/* Hour Grid with Events */}
      <div className="relative space-y-0 border-l">
        {hours.map((hour) => {
          const hourNum = Number.parseInt(hour)

          return (
            <div key={hour} className="flex border-b">
              <div className="p-3 text-xs text-muted-foreground font-semibold w-12 flex-shrink-0 text-right">
                {String(hourNum % 12 || 12).padStart(2, "0")}
              </div>

              <div className="flex-1 relative min-h-16 border-l" style={{ position: "relative" }}>
                {/* Render events that start in this hour */}
                {eventRanges
                  .filter((event) => {
                    const [eventHour] = event.startTime.split(":").map(Number)
                    return eventHour === hourNum
                  })
                  .map((event) => {
                    const colors = colorMap[event.color] || colorMap.pink
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 rounded border ${colors.bg} ${colors.text} ${colors.borderLeft} p-3 text-xs`}
                        style={{
                          top: `${event.top}px`,
                          height: `${event.height}px`,
                          minHeight: "50px",
                          zIndex: 10 + event.id,
                        }}
                      >
                        <div className="font-semibold">
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="font-medium line-clamp-2">{event.title}</div>
                        {event.group && <div className="text-xs opacity-75 line-clamp-1">{event.group}</div>}
                      </div>
                    )
                  })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
