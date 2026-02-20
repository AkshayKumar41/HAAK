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

interface WeekViewProps {
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
    bg: "bg-blue-50",
    text: "text-blue-900",
    borderLeft: "border-l-4 border-l-blue-500",
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

export function WeekView({ currentDate, events }: WeekViewProps) {
  const weekDays = useMemo(() => {
    // Calculate the start of the week (Monday)
    // getDay() returns 0 for Sunday, 1 for Monday, etc. We want Monday to be the first day
    const dayOfWeek = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1 // Convert Sunday (0) to 6, others -1
    const weekStart = new Date(currentDate)
    weekStart.setDate(currentDate.getDate() - dayOfWeek)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day)
    }
    return days
  }, [currentDate])

  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = String(i).padStart(2, "0")
    return hour
  })

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear(),
    )
  }

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

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

  return (
    <div className="p-4">
      <div className="grid grid-cols-8 gap-px border-b">
        <div className="p-3 text-xs font-semibold text-muted-foreground w-12">Time</div>
        {weekDays.map((day, idx) => (
          <div key={idx} className="p-3 text-center">
            <div className="text-xs font-semibold text-muted-foreground">{dayNames[idx]}</div>
            <div className="text-sm font-bold mt-1">{day.getDate()}</div>
          </div>
        ))}
      </div>

      {/* Hour Grid */}
      <div className="relative border-t">
        {hours.map((hour) => {
          const hourNum = Number.parseInt(hour)
          return (
            <div key={hour} className="grid grid-cols-8 gap-px border-b auto-rows-[60px]">
              <div className="p-2 text-xs text-muted-foreground font-semibold text-right pr-3 w-12 flex items-start justify-end">
                {String(hourNum % 12 || 12).padStart(2, "0")}
              </div>

              {weekDays.map((day, dayIdx) => {
                const dayEvents = getEventsForDate(day)
                const eventsInThisHour = dayEvents.filter((event) => {
                  const [eventHour] = event.startTime.split(":").map(Number)
                  return eventHour === hourNum
                })

                return (
                  <div
                    key={`${hour}-${dayIdx}`}
                    className="border-l border-r relative"
                    style={{ position: "relative" }}
                  >
                    {eventsInThisHour.map((event) => {
                      const colors = colorMap[event.color] || colorMap.pink
                      const top = getEventPosition(event.startTime)
                      const height = getEventHeight(event.startTime, event.endTime)

                      return (
                        <div
                          key={event.id}
                          className={`absolute left-1 right-1 rounded p-2 text-xs ${colors.bg} ${colors.text} ${colors.borderLeft} overflow-hidden cursor-pointer hover:opacity-90`}
                          style={{
                            top: `${((top % 60) / 60) * 100}%`,
                            height: `${(height / 60) * 100}%`,
                            minHeight: "40px",
                          }}
                        >
                          <div className="font-semibold text-xs">
                            {event.startTime} - {event.endTime}
                          </div>
                          <div className="font-medium line-clamp-2">{event.title}</div>
                          {event.group && <div className="text-xs opacity-75">{event.group}</div>}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
