"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LogOut, UserPen, CircleGauge, CalendarArrowUp, CalendarDays, Inbox, Users } from "lucide-react"

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Dashboard", icon: CircleGauge},
    { href: "/requests", label: "Requests", icon: CalendarArrowUp},
    { href: "/calendar", label: "Calendar", icon: CalendarDays},
    { href: "/inbox", label: "Inbox", icon: Inbox},
    { href: "/partners", label: "Partners", icon: Users},
  ]

  return (
    <aside
      className={`${open ? "w-44" : "w-16"} transition-all duration-300 bg-white border-r border-border flex flex-col`}
    >
      <div className="p-3 border-b border-border flex items-center gap-2">
        <button onClick={onToggle} className="p-2 hover:bg-muted rounded-lg transition flex-shrink-0" aria-label="Toggle sidebar">
          <Menu className="w-5 h-5" />
        </button>
        {open && (
          <div className="text-base font-bold text-pink-500 whitespace-nowrap">
            Live Time
          </div>
        )}
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Navigation */}
        <nav className="space-y-4">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center ${open ? '' : 'justify-center'} gap-2.5 ${open ? 'px-3' : 'px-2'} py-2 rounded-lg transition-colors ${
                    pathname === item.href ? "bg-pink-500 text-white" : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0"/>
                  {open && <span className="text-sm font-medium">{item.label}</span>}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom items */}
      <div className="p-4 border-t border-border space-y-3">
        <div className={`flex items-center ${open ? '' : 'justify-center'} gap-2.5 ${open ? 'px-3' : 'px-2'} py-2 text-sm text-foreground cursor-pointer hover:bg-muted rounded`}>
          <UserPen className="w-5 h-5 flex-shrink-0" />
          {open && <span>Brand profile</span>}
        </div>
        <div className={`flex items-center ${open ? '' : 'justify-center'} gap-2.5 ${open ? 'px-3' : 'px-2'} py-2 text-sm text-foreground cursor-pointer hover:bg-muted rounded`}>
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {open && <span>Log out</span>}
        </div>
      </div>
    </aside>
  )
}