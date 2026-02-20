"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Bell, CalendarIcon, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EventSidebar } from "@/components/calendar/event-sidebar"
import { MonthView } from "@/components/calendar/month-view"
import { WeekView } from "@/components/calendar/week-view"
import { DayView } from "@/components/calendar/day-view"

// Mock event data
const mockEvents = [
  {
    id: 1,
    title: "Retro Pool Party",
    time: "11:19 AM",
    location: "56 Davion Mission",
    group: "Pink and Purple Craft",
    image: "https://images.unsplash.com/photo-1551284049-bebda4e67f71?w=150&h=150&fit=crop",
    date: new Date(2025, 9, 4),
    startTime: "09:10",
    endTime: "03:30",
    color: "purple",
  },
  {
    id: 2,
    title: "Weekend Festival",
    time: "5:00 PM",
    date: new Date(2025, 9, 16),
    location: "853 Moore Flats Suite 158",
    group: "Group name",
    image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=150&h=150&fit=crop",
    startTime: "17:00",
    endTime: "22:00",
    color: "blue",
  },
  {
    id: 3,
    title: "Ultra Europe Trip",
    time: "5:00 PM",
    date: new Date(2025, 9, 16),
    location: "853 Moore Flats Suite 158",
    group: "Group name",
    image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop",
    startTime: "09:00",
    endTime: "17:00",
    color: "blue",
  },
  {
    id: 4,
    title: "Glastonbury Festival",
    date: new Date(2025, 11, 3),
    startTime: "09:10",
    endTime: "18:00",
    color: "cyan",
  },
  {
    id: 5,
    title: "Workplace Diversity and Inclusion Initiatives",
    date: new Date(2025, 11, 4),
    location: "56 Davion Mission",
    group: "Group name",
    startTime: "04:00",
    endTime: "06:59",
    color: "orange",
  },
  {
    id: 6,
    title: "Employee Engagement and Retention Techniques",
    date: new Date(2025, 11, 4),
    location: "56 Davion Mission",
    group: "Group name",
    startTime: "06:00",
    endTime: "07:59",
    color: "green",
  },
]

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 1))
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month")
  const [searchQuery, setSearchQuery] = useState("")

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const prevDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const prevWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const filteredEvents = useMemo(() => {
    return mockEvents.filter((event) => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])

  const getDateLabel = () => {
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long" }
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", options)
    } else if (viewMode === "week") {
      return currentDate.toLocaleDateString("en-US", options)
    } else {
      const dayOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
      return currentDate.toLocaleDateString("en-US", dayOptions)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header */}
      <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between flex-shrink-0">
        <h1 className="text-2xl font-bold">Calendar</h1>
        
        {/* Centered Search Bar */}
        <div className="flex-1 flex justify-center max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search" 
              className="bg-muted pl-10 border-0 w-full" 
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition">
            <CalendarIcon className="w-5 h-5 text-foreground" />
          </button>
          <button className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition relative">
            <Bell className="w-5 h-5 text-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 ml-2">
            <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div className="text-sm">
              <div className="font-semibold">Admin Name</div>
              <div className="text-xs text-muted-foreground">Admin</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Happening Soon */}
        <EventSidebar events={filteredEvents} currentDate={currentDate} />

        {/* Right Side - Calendar View */}
        <div className="flex-1 overflow-auto bg-background">
          <div className="p-6 space-y-6">
            {/* Tabs and Controls */}
            <div className="flex items-center justify-between gap-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as typeof viewMode)}>
                <TabsList className="bg-muted">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={viewMode === "month" ? prevMonth : viewMode === "week" ? prevWeek : prevDay}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="min-w-40 text-center font-semibold text-lg">{getDateLabel()}</div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={viewMode === "month" ? nextMonth : viewMode === "week" ? nextWeek : nextDay}
                  className="h-9 w-9"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex-1 max-w-xs">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search an event, city or school"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-muted border-0 pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Calendar Views */}
            <div className="bg-white rounded-lg border">
              {viewMode === "month" && <MonthView currentDate={currentDate} events={filteredEvents} />}
              {viewMode === "week" && <WeekView currentDate={currentDate} events={filteredEvents} />}
              {viewMode === "day" && <DayView currentDate={currentDate} events={filteredEvents} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
