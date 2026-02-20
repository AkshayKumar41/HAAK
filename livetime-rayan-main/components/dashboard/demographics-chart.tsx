"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DemographicsChart() {
  const demographics = [
    { label: "Recurring attendees", percentage: 82, color: "#ec4899" },
    { label: "Men", percentage: 75, color: "#f472b6" },
    { label: "Women", percentage: 60, color: "#f9a8d4" },
    { label: "16-25 years old", percentage: 62, color: "#fce7f3" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Audience Reached</CardTitle>
        <p className="text-sm text-muted-foreground">Attendee Demographics in the last 30 days</p>
      </CardHeader>
      <CardContent>
        <div className="relative w-48 h-48 mx-auto mb-6">
          {/* Donut chart circles */}
          <svg className="w-full h-full" viewBox="0 0 200 200">
            {/* Outer circle - 82% */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="#ec4899"
              strokeWidth="12"
              strokeDasharray={`${(82 / 100) * 565} 565`}
              transform="rotate(-90 100 100)"
            />
            {/* Second circle - 75% */}
            <circle
              cx="100"
              cy="100"
              r="72"
              fill="none"
              stroke="#f472b6"
              strokeWidth="12"
              strokeDasharray={`${(75 / 100) * 452} 452`}
              transform="rotate(-90 100 100)"
            />
            {/* Third circle - 60% */}
            <circle
              cx="100"
              cy="100"
              r="54"
              fill="none"
              stroke="#f9a8d4"
              strokeWidth="12"
              strokeDasharray={`${(60 / 100) * 339} 339`}
              transform="rotate(-90 100 100)"
            />
            {/* Inner text */}
            <text x="100" y="100" textAnchor="middle" dy="0.3em" className="text-sm font-bold" fontSize="18">
              82%
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          {demographics.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <span>{item.label}</span>
              </div>
              <span className="font-semibold">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
