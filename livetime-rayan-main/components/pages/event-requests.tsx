"use client"

import { Calendar, Bell, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { EventRequestsTable } from "@/components/event-requests/event-requests-table"

const mockData = [
  {
    id: 1,
    host: "Christine Brooks",
    eventTitle: "Dough & Design Night",
    location: "123 Green Hall 28",
    date: "04 Sep 2025",
    rsvps: 100,
    status: "pending",
    eventType: "social",
  },
  {
    id: 2,
    host: "Wellness Collective",
    eventTitle: "Run & Refuel",
    location: "123 Green Hall 28",
    date: "05 Sep 2025",
    rsvps: 50,
    status: "pending",
    eventType: "athletic",
  },
  {
    id: 3,
    host: "Caribbean Students As...",
    eventTitle: "Taste of the Tropics",
    location: "123 Green Hall 28",
    date: "23 Nov 2025",
    rsvps: 200,
    status: "pending",
    eventType: "social",
  },
  {
    id: 4,
    host: "UX Collective",
    eventTitle: "Design Your Resume",
    location: "123 Green Hall 28",
    date: "05 Feb 2025",
    rsvps: 20,
    status: "pending",
    eventType: "career",
  },
  {
    id: 5,
    host: "Women in Business",
    eventTitle: "LinkedIn & Lemonade",
    location: "123 Green Hall 28",
    date: "29 Jul 2025",
    rsvps: 1000,
    status: "pending",
    eventType: "career",
  },
  {
    id: 6,
    host: "Fine Arts Society",
    eventTitle: "Ceramics & Chill",
    location: "123 Green Hall 28",
    date: "15 Aug 2025",
    rsvps: 300,
    status: "pending",
    eventType: "academic",
  },
  {
    id: 7,
    host: "Computer Science Club",
    eventTitle: "Byte & Brew",
    location: "123 Green Hall 28",
    date: "21 Dec 2025",
    rsvps: 30,
    status: "pending",
    eventType: "academic",
  },
  {
    id: 8,
    host: "Roots & Rhythms",
    eventTitle: "Midnight Munchies Mixer",
    location: "123 Green Hall 28",
    date: "30 Apr 2015",
    rsvps: 80,
    status: "pending",
    eventType: "social",
  },
  {
    id: 9,
    host: "Women in STEM",
    eventTitle: "Coffee & Connections",
    location: "123 Green Hall 28",
    date: "09 Jan 2025",
    rsvps: 30,
    status: "pending",
    eventType: "leadership",
  },
]

const eventTypes = [
  "social",
  "academic",
  "career",
  "volunteering",
  "faith",
  "athletic",
  "leadership",
  "politics",
]

const parseDateValue = (value: string) => new Date(value).getTime()

export function EventRequests() {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [rsvpSort, setRsvpSort] = useState<"none" | "low-high" | "high-low">("none")
  const [dateSort, setDateSort] = useState<"none" | "newest" | "oldest">("none")
  const [showEventTypes, setShowEventTypes] = useState(false)
  const [showRsvpPrompt, setShowRsvpPrompt] = useState(false)
  const [showDatePrompt, setShowDatePrompt] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const filteredByType =
    selectedTypes.length === 0
      ? mockData
      : mockData.filter((event) => selectedTypes.includes(event.eventType))

  const sortedData = [...filteredByType].sort((a, b) => {
    if (dateSort === "newest") {
      return parseDateValue(b.date) - parseDateValue(a.date)
    }
    if (dateSort === "oldest") {
      return parseDateValue(a.date) - parseDateValue(b.date)
    }
    if (rsvpSort === "low-high") {
      return a.rsvps - b.rsvps
    }
    if (rsvpSort === "high-low") {
      return b.rsvps - a.rsvps
    }
    return 0
  })

  const pageSize = 9
  const currentPage = 1
  const totalItems = sortedData.length

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = totalItems === 0 ? 0 : Math.min(totalItems, currentPage * pageSize)

  const formatNumber = (value: number) => value.toString()

  return (
    <div className="bg-white">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between bg-white">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1 max-w-sm">
            <Input placeholder="Search" className="bg-muted" />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-muted rounded-lg transition">
            <Calendar className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-muted rounded-lg relative transition">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-pink-500 rounded-full"></span>
          </button>
          <div className="flex items-center gap-3">
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

      {/* Content */}
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Event Requests</h1>
        </div>

        {/* Filters */}
        <div className="relative z-20 flex flex-wrap gap-3 items-center">
          <Button
            className="bg-pink-100 text-pink-600 hover:bg-pink-200"
            variant="outline"
            onClick={() =>
              setShowFilters((prev) => {
                const next = !prev
                if (!next) {
                  setShowEventTypes(false)
                  setShowRsvpPrompt(false)
                  setShowDatePrompt(false)
                }
                return next
              })
            }
          >
            ☰ Filter by
          </Button>

          <div
            className={`
              flex flex-wrap gap-3 items-center
              transform origin-left transition-all duration-200
              ${showFilters ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"}
            `}
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowEventTypes((prev) => !prev)
                  setShowRsvpPrompt(false)
                  setShowDatePrompt(false)
                }}
                className="h-9 px-4 inline-flex items-center gap-2 border border-border rounded-lg text-sm bg-white shadow-sm"
              >
                <span>Event type</span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-150 ${
                    showEventTypes ? "rotate-90" : ""
                  }`}
                />
              </button>
              <div
                className={`
                  absolute mt-2 z-10 w-80 left-0 rounded-3xl border border-slate-100 bg-white shadow-lg px-6 py-5
                  transform origin-top transition-all duration-150
                  ${showEventTypes ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-95 pointer-events-none"}
                `}
              >
                <div className="text-sm font-semibold mb-3">Select Event Type</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {eventTypes.map((type) => {
                    const isActive = selectedTypes.includes(type)
                    const label = type.charAt(0).toUpperCase() + type.slice(1)

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setSelectedTypes((prev) =>
                            prev.includes(type)
                              ? prev.filter((t) => t !== type)
                              : [...prev, type]
                          )
                        }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                          isActive
                            ? "bg-pink-500 text-white shadow-sm"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] text-muted-foreground">
                    *You can choose multiple Event types
                  </p>
                  <Button
                    type="button"
                    className="rounded-full bg-pink-500 hover:bg-pink-600 text-xs px-4 py-1.5"
                    onClick={() => setShowEventTypes(false)}
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRsvpPrompt((prev) => !prev)
                  setShowEventTypes(false)
                  setShowDatePrompt(false)
                }}
                className="h-9 px-4 inline-flex items-center gap-2 border border-border rounded-lg text-sm bg-white shadow-sm"
              >
                <span>Number of RSVP&apos;s</span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-150 ${
                    showRsvpPrompt ? "rotate-90" : ""
                  }`}
                />
              </button>
              <div
                className={`
                  absolute mt-2 z-10 w-72 left-0 rounded-3xl border border-slate-100 bg-white shadow-lg px-4 py-4
                  transform origin-top transition-all duration-150
                  ${showRsvpPrompt ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-95 pointer-events-none"}
                `}
              >
                <div className="text-sm font-semibold mb-3">Number of RSVP&apos;s</div>
                <div className="flex flex-wrap gap-2 mb-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setRsvpSort("low-high")}
                    className={`px-4 py-1.5 rounded-full inline-flex items-center justify-center transition ${
                      rsvpSort === "low-high"
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Low to high
                  </button>
                  <button
                    type="button"
                    onClick={() => setRsvpSort("high-low")}
                    className={`px-4 py-1.5 rounded-full inline-flex items-center justify-center transition ${
                      rsvpSort === "high-low"
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    High to low
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] text-muted-foreground">Sort events by RSVP count.</p>
                  <Button
                    type="button"
                    className="rounded-full bg-pink-500 hover:bg-pink-600 text-xs px-4 py-1.5"
                    onClick={() => setShowRsvpPrompt(false)}
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowDatePrompt((prev) => !prev)
                  setShowEventTypes(false)
                  setShowRsvpPrompt(false)
                }}
                className="h-9 px-4 inline-flex items-center gap-2 border border-border rounded-lg text-sm bg-white shadow-sm"
              >
                <span>Date</span>
                <ChevronRight
                  className={`w-3 h-3 transition-transform duration-150 ${
                    showDatePrompt ? "rotate-90" : ""
                  }`}
                />
              </button>
              <div
                className={`
                  absolute mt-2 z-10 w-72 left-0 rounded-3xl border border-slate-100 bg-white shadow-lg px-4 py-4
                  transform origin-top transition-all duration-150
                  ${showDatePrompt ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-1 scale-95 pointer-events-none"}
                `}
              >
                <div className="text-sm font-semibold mb-3">Date</div>
                <div className="flex flex-wrap gap-2 mb-4 text-sm">
                  <button
                    type="button"
                    onClick={() => setDateSort("newest")}
                    className={`px-4 py-1.5 rounded-full inline-flex items-center justify-center transition ${
                      dateSort === "newest"
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Newest first
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateSort("oldest")}
                    className={`px-4 py-1.5 rounded-full inline-flex items-center justify-center transition ${
                      dateSort === "oldest"
                        ? "bg-pink-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    Oldest first
                  </button>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] text-muted-foreground">Sort events by date.</p>
                  <Button
                    type="button"
                    className="rounded-full bg-pink-500 hover:bg-pink-600 text-xs px-4 py-1.5"
                    onClick={() => setShowDatePrompt(false)}
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="text-muted-foreground text-sm"
              type="button"
              onClick={() => {
                setSelectedTypes([])
                setRsvpSort("none")
                setDateSort("none")
                setShowEventTypes(false)
                setShowRsvpPrompt(false)
                setShowDatePrompt(false)
              }}
            >
              ↻ Reset Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        {sortedData.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No events match the selected filters.
          </div>
        ) : (
          <EventRequestsTable data={sortedData} />
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {totalItems === 0
              ? "Showing 0 of 0"
              : `Showing ${formatNumber(startIndex)}-${formatNumber(endIndex)} of ${formatNumber(totalItems)}`}
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              ←
            </Button>
            <Button variant="ghost" size="sm">
              →
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
