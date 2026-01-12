"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { Home, BarChart2, Settings } from "lucide-react"

import { cn } from "@/lib/utils"
import { ModeToggle } from "./mode-toggle"

export default function Sidemenu({ className }: { className?: string }) {
  const pathname = usePathname() || "/"

  const items = [
    { href: "/overview", label: "Overview", icon: Home },
    { href: "/reports", label: "Reports", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-screen border-r bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100",
        className
      )}
    >
      <div className="flex items-center gap-2 px-4 py-6 text-lg font-semibold">
        <span className="block rounded-sm bg-primary px-2 py-1 text-sm font-bold text-slate-300 dark:text-slate-700">Pilath</span>
        <span className="text-sm text-muted-foreground">Dashboard</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-slate-700 hover:bg-accent/60 hover:text-accent-foreground dark:text-slate-300"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4">
        <ModeToggle />
      </div>
    </aside>
  )
}
