"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { Home, BarChart2, Settings, Menu, X, LogOut, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { ModeToggle } from "./mode-toggle"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/hook/auth.store"

export default function Sidemenu({ className }: { className?: string }) {
  const pathname = usePathname() || "/"
  const [isOpen, setIsOpen] = React.useState(false)
  const { user, logout } = useAuthStore()

  const items = [
    { href: "/overview", label: "Suivi", icon: Home },
    { href: "/reports", label: "Rapports", icon: BarChart2 },
    { href: "/settings", label: "Paramètres", icon: Settings },
  ]

  // Ajouter le lien admin seulement si l'utilisateur est admin (level 2)
  const adminItems = (user?.roleLevel ?? 0) >= 2 
    ? [{ href: "/admin/users", label: "Utilisateurs", icon: Users }]
    : []

  const allItems = [...items, ...adminItems]

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // Ignorer les erreurs de logout API, on déconnecte quand même localement
    } finally {
      logout()
    }
  }

  return (
    <>
      {/* Bouton menu hamburger mobile */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 flex flex-col w-64 h-screen border-r bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 z-40 transition-transform duration-300",
          "md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          className
        )}
      >
        <div className="flex items-center gap-2 px-4 py-6 text-lg font-semibold">
          <span className="block rounded-sm bg-primary px-2 py-1 text-sm font-bold text-slate-300 dark:text-slate-700">VappleStore</span>
          <span className="text-sm text-muted-foreground">Dashboard</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {allItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
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

        <div className="px-4 py-3 border-t">
          {user && (
            <div className="mb-3 px-3 py-2 text-sm">
              <div className="font-medium text-foreground">{user.username}</div>
              <div className="text-xs text-muted-foreground">{user.role}</div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full mb-3"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
          <ModeToggle />
        </div>
      </aside>
    </>
  )
}
