import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight } from "lucide-react"
import type { ReactNode } from "react"

interface StatsCardProps {
  title: string
  value: string
  change?: string
  bgColor?: string
  actions?: ReactNode
}

export function StatsCard({ title, value, change, bgColor = "bg-amber-50", actions }: StatsCardProps) {
  return (
    <Card className={`${bgColor} border-0 shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="text-sm font-medium text-gray-700">{title}</div>
          <button className="p-1 hover:bg-black hover:bg-opacity-5 rounded transition">
            <ArrowUpRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="text-4xl font-bold text-gray-900 mb-4">{value}</div>

        {change && (
          <div className="text-sm text-pink-600 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-4 h-4" />
            {change}
          </div>
        )}

        {actions && actions}
      </CardContent>
    </Card>
  )
}
