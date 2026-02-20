"use client"

import { Menu, Calendar, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-border px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4 flex-1">
        <button onClick={onMenuClick} className="p-2 hover:bg-muted rounded-lg">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 max-w-sm">
          <Input placeholder="Search" className="bg-muted" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-muted rounded-lg">
          <Calendar className="w-5 h-5" />
        </button>
        <button className="p-2 hover:bg-muted rounded-lg relative">
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
  )
}
