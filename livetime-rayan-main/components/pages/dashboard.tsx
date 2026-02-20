"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { StatsCard } from "@/components/dashboard/stats-card"
import { USHeatmap } from "@/components/dashboard/us-heatmap"
import { DemographicsChart } from "@/components/dashboard/demographics-chart"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { Calendar, Bell } from "lucide-react"
import { SearchBar } from "../ui/searchbar"

const attendanceData = [
  { month: "Jan", attendance: 12 },
  { month: "Feb", attendance: 19 },
  { month: "Mar", attendance: 8 },
  { month: "Apr", attendance: 22 },
  { month: "May", attendance: 15 },
  { month: "Jun", attendance: 18 },
  { month: "Jul", attendance: 14 },
]

export function Dashboard() {
  return (
    <div className="p-6 bg-white space-y-6">
      {/* Hero Section */}
      <div
        className="relative rounded-2xl p-8 text-white overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/popcorn-bg.jpg')" }}
      >
        <div className="absolute inset-0 bg-black/30"></div>

        {/* Header */}
        <div className="relative z-20 mb-6 flex items-center justify-between gap-4">

          {/* Title */}
          <h1 className="text-3xl font-bold pl-2">Rob's Backstage<br/>Popcorn</h1>

          {/* Search Bar */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-md">
              <SearchBar />
            </div>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-4">
            <button className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-md hover:bg-white/40 transition">
              <Calendar className="w-5 h-5 text-white" />
            </button>

            <button className="w-9 h-9 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-md hover:bg-white/40 relative transition">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center text-white font-bold text-sm">
                B
              </div>
              <div className="text-sm leading-tight">
                <div className="font-semibold">Admin Name</div>
                <div className="text-xs text-pink-100">Admin</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Events"
            value="100"
            change="8.5% from last month"
            bgColor="bg-yellow-100 backdrop-blur-md"
          />

          <StatsCard
            title="Sales (In-store, Online)"
            value="$20,000"
            change="4.3% from last month"
            bgColor="bg-yellow-100 backdrop-blur-md"
          />

          <StatsCard
            title="Products distributed"
            value="2000"
            change="1.3% up from past week"
            bgColor="bg-yellow-100 backdrop-blur-md"
          />

          <StatsCard
            title="Event Requests"
            value="200"
            bgColor="bg-white backdrop-blur-md"
            actions={
              <div className="flex flex-wrap gap-1.5 mt-4">
                <Button size="sm" className="rounded-full bg-pink-500 hover:bg-pink-600 text-white text-xs px-2.5 py-1 whitespace-nowrap flex-1 min-w-0">
                  See requests
                </Button>
                <Button size="sm" variant="outline" className="bg-yellow-100 rounded-full text-xs px-2.5 py-1 whitespace-nowrap flex-1 min-w-0">
                  Export to CSV
                </Button>
              </div>
            }
          />
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* National Reach */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">National Reach</CardTitle>
              <p className="text-sm text-muted-foreground">Reached states in the United States</p>
            </CardHeader>
            <CardContent>
              <USHeatmap />
            </CardContent>
          </Card>
        </div>

        {/* Demographics */}
        <DemographicsChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Attendance Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Event Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="attendance" fill="#ec4899" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
        
        {/* Upcoming Events */}
        <UpcomingEvents />
      </div>
    </div>
  )
}
