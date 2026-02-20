"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link  from "next/link"

export function UpcomingEvents() {
  const events = [
    {
      date: "Monday, Dec 19th 5:00PM",
      title: "Dough & Design Night",
      host: "Christine Brooks",
      rsvps: 50,
    },
    {
      date: "Monday, Dec 19th 5:00PM",
      title: "Design Your Resume",
      host: "UX Collective",
      rsvps: 30,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <p className="text-sm text-muted-foreground">Partnerships happening soon</p>
          </div>
          <Button className="bg-pink-500 hover:bg-pink-600 text-white text-sm">
            <Link href="/requests">See all</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {events.map((event, idx) => (
          <div key={idx} className="pb-4 border-b border-border last:border-0 last:pb-0">
            <div className="text-xs text-muted-foreground mb-1">{event.date}</div>
            <div className="font-semibold text-sm">{event.title}</div>
            <div className="text-xs text-muted-foreground">{event.host}</div>
            <div className="text-sm font-bold mt-2 text-pink-600">{event.rsvps} RSVPS</div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
