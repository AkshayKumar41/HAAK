"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface FilterPanelProps {
  selectedTypes: string[]
  onTypeChange: (types: string[]) => void
}

export function FilterPanel({ selectedTypes, onTypeChange }: FilterPanelProps) {
  const eventTypes = ["Social", "Academic", "Career", "Volunteering", "Faith", "Athletic", "Leadership", "Politics"]

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type))
    } else {
      onTypeChange([...selectedTypes, type])
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="font-semibold mb-3">Select Event Type</h3>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedTypes.includes(type)
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-transparent text-foreground border border-border hover:border-pink-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">*You can choose multiple Event types</p>
        </div>

        <Button className="w-full bg-pink-500 hover:bg-pink-600 text-white">Apply Filter</Button>
      </CardContent>
    </Card>
  )
}
