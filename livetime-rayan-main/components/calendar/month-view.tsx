"use client"

import { useMemo } from "react"

interface Event {
  id: number
  title: string
  date: Date
  color: string
  startTime?: string
  endTime?: string
}

interface MonthViewProps {
  currentDate: Date
  events: Event[]
}

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  purple: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  cyan: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  green: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  pink: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
}

export function MonthView({ currentDate, events }: MonthViewProps) {
  const weeks = useMemo(() => {
    const result = []
    // Calculate the start of the month
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    // Calculate the start of the calendar (first day of the week that contains month start)
    // getDay() returns 0 for Sunday, 1 for Monday, etc. We want Monday (1) to be the first day
    const firstDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 // Convert Sunday (0) to 6, others -1
    const calendarStart = new Date(monthStart)
    calendarStart.setDate(calendarStart.getDate() - firstDayOfWeek)

    // Generate exactly 6 weeks (42 days)
    for (let i = 0; i < 6; i++) {
      const week = []
      for (let j = 0; j < 7; j++) {
        const dayDate = new Date(calendarStart)
        dayDate.setDate(calendarStart.getDate() + (i * 7) + j)
        week.push(dayDate)
      }
      result.push(week)
    }

    return result
  }, [currentDate])

  const getEventsForDate = (date: Date) => {
    return events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear(),
    )
  }

  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]

  return (
    <div className="p-4">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px border-b">
        {dayNames.map((day) => (
          <div key={day} className="p-3 font-bold text-center text-sm">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-px border-b auto-rows-[120px]">
          {week.map((date, dateIndex) => {
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const dayEvents = getEventsForDate(date)

            return (
              <div
                key={dateIndex}
                className={`p-3 border-r last:border-r-0 ${isCurrentMonth ? "" : "bg-gray-50"} ${
                  dateIndex === week.length - 1 ? "" : "border-r"
                }`}
              >
                <div className={`text-sm font-semibold mb-2 ${isCurrentMonth ? "" : "text-muted-foreground"}`}>
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event) => {
                    const colors = colorMap[event.color] || colorMap.pink
                    return (
                      <div
                        key={event.id}
                        className={`text-xs p-1.5 rounded border ${colors.bg} ${colors.text} ${colors.border} line-clamp-2 cursor-pointer hover:opacity-80`}
                      >
                        {event.startTime && <span className="font-semibold">{event.startTime}</span>}
                        <p className="truncate">{event.title}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
