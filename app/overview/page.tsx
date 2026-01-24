"use client"

import React, { useMemo, useState, useEffect } from "react"
import { storeRevenue } from "@/hook/revenue.store"
import { storePurchase } from "@/hook/purchase.store"
import { storeSettings } from "@/hook/settings.store"
import { useAuthStore } from "@/hook/auth.store"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import AppBarChart from "@/components/charts/app-bar-chart"
import AppPieChart from "@/components/charts/app-pie-chart"
import AppLineChart from "@/components/charts/app-line-chart"
import { getDaysInMonth, calculateDailyStats } from "@/lib/calculations"
import type { RevenueEntry as _RevenueEntry } from "@/hook/revenue.store"
import type { PurchaseEntry as _PurchaseEntry } from "@/hook/purchase.store"

// Format pour afficher les montants en EUR
const currencyFormatter = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })

/**
 * Page de suivi du chiffre d'affaires
 * Affiche les KPIs et graphiques pour analyser les revenus et dépenses
 */
export default function Overview() {
  const entries = storeRevenue((s) => s.entries)
  const revenueLoading = storeRevenue((s) => s.loading)
  const purchaseLoading = storePurchase((s) => s.loading)
  const purchases = storePurchase((s) => s.entries)
  const hideSundays = storeSettings((s) => s.hideSundays)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const today = new Date()
  const currentMonth = today.toISOString().slice(0, 7) // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  // hideSundaysInChart est indépendant et contrôle uniquement l'axe XY
  const [hideSundaysInChart, setHideSundaysInChart] = useState(false)

  // Charger les données au démarrage et quand l'utilisateur se connecte
  useEffect(() => {
    if (isAuthenticated) {
      console.warn("🔄 Chargement des données (authentification détectée)");
      storeRevenue.getState().fetchEntries()
      storePurchase.getState().fetchEntries()
    }
  }, [isAuthenticated])

  // Calculer les données par mois
  const _monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; expenses: number }>()

    entries.forEach((e) => {
      const month = e.date.slice(0, 7)
      const existing = map.get(month) || { month, revenue: 0, expenses: 0 }
      existing.revenue += e.totalTTC
      map.set(month, existing)
    })

    purchases.forEach((p) => {
      const month = p.date.slice(0, 7)
      const existing = map.get(month) || { month, revenue: 0, expenses: 0 }
      existing.expenses += p.totalTTC
      map.set(month, existing)
    })

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({
        ...d,
        profit: d.revenue - d.expenses,
      }))
  }, [entries, purchases])

  // KPIs - filtrés par mois sélectionné
  const totalRevenue = useMemo(
    () =>
      entries
        .filter((e) => e.date.startsWith(selectedMonth))
        .reduce((sum, e) => sum + e.totalTTC, 0),
    [entries, selectedMonth]
  )

  const totalExpenses = useMemo(
    () =>
      purchases
        .filter((p) => p.date.startsWith(selectedMonth))
        .reduce((sum, p) => sum + p.totalTTC, 0),
    [purchases, selectedMonth]
  )

  const _netProfit = totalRevenue - totalExpenses

  // Statistiques par jour du mois sélectionné
  const dailyStats = useMemo(
    () => calculateDailyStats(entries, selectedMonth, hideSundaysInChart),
    [entries, selectedMonth, hideSundaysInChart]
  )

  // Données détaillées pour le chart par jour du mois sélectionné
  const dailyRevenuesData = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth)
    const [year, month] = selectedMonth.split("-").map(Number)
    const data: Array<{ day: number; revenue: number }> = []

    // Créer une map des revenus par jour pour le mois sélectionné
    const revenueByDay = new Map<number, number>()
    entries.forEach((e) => {
      if (e.date.startsWith(selectedMonth)) {
        const day = parseInt(e.date.split("-")[2], 10)
        const existing = revenueByDay.get(day) || 0
        revenueByDay.set(day, existing + e.totalTTC)
      }
    })

    // Créer les données pour chaque jour du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day)
      const dayIsSunday = date.getDay() === 0

      // Inclure les dimanches si hideSundaysInChart = false, sinon les exclure
      if (dayIsSunday && hideSundaysInChart) continue

      data.push({
        day,
        revenue: revenueByDay.get(day) || 0,
      })
    }

    return data
  }, [entries, selectedMonth, hideSundaysInChart])

  // Afficher un indicateur de chargement pendant le fetch initial
  if (revenueLoading || purchaseLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement des données...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="flex-1 overflow-auto p-3 md:p-5 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header avec titre et sélecteur de mois */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">SUIVI</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="month-selector" className="text-sm">Sélectionner le mois</Label>
            <Input
              id="month-selector"
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full md:w-48"
            />
          </div>
        </div>

        {/* Grid principal responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-5">
          {/* Jours d'ouverture - BarChart */}
          <Card className="lg:col-span-1 py-3 md:py-3 xl:py-5">
            <CardHeader className="px-3 md:px-4 xl:px-5">
              <CardTitle className="text-base md:text-lg">Jours d'ouverture</CardTitle>
              <CardDescription>{selectedMonth}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 md:px-4 xl:px-5">
              <AppBarChart
                data={
                  hideSundaysInChart
                    ? [
                        { name: "Ouvert", ouvert: dailyStats.openDays, fermé: 0 },
                        { name: "Fermé", ouvert: 0, fermé: dailyStats.closedDays },
                      ]
                    : [
                        { name: "Ouvert", ouvert: dailyStats.openDays, fermé: 0, dimanche: 0 },
                        { name: "Fermé", ouvert: 0, fermé: dailyStats.closedDays, dimanche: dailyStats.sundayDays },
                      ]
                }
                hideSundays={hideSundaysInChart}
              />
            </CardContent>
            {/* Légende personnalisée */}
            <div className="flex flex-wrap gap-3 md:gap-4 justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-emerald-600"></div>
                <span className="text-xs md:text-sm font-medium">Ouvert</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-red-500"></div>
                <span className="text-xs md:text-sm font-medium">Fermé</span>
              </div>
              {!hideSundays && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-gray-400"></div>
                  <span className="text-xs md:text-sm font-medium">Dimanche</span>
                </div>
              )}
            </div>
          </Card>

          {/* Distribution des revenus par jour - PieChart */}
          <Card className="lg:col-span-1 py-3 md:py-3 xl:py-5">
            <CardHeader className="px-3 md:px-4 xl:px-5">
              <CardTitle className="text-base md:text-lg">Distribution</CardTitle>
              <CardDescription>Revenus par jour</CardDescription>
            </CardHeader>
            <CardContent className="px-3 md:px-4 xl:px-5">
              <AppPieChart
                data={
                  hideSundays
                    ? [
                        { name: "0€", value: dailyStats.distribution.zero },
                        { name: "< 300€", value: dailyStats.distribution.lessThan300 },
                        { name: ">300€", value: dailyStats.distribution.between300And400 },
                        { name: "≥ 400€", value: dailyStats.distribution.greaterOrEqual400 },
                      ]
                    : [
                        { name: "0€", value: dailyStats.distribution.zero },
                        { name: "< 300€", value: dailyStats.distribution.lessThan300 },
                        { name: ">300€", value: dailyStats.distribution.between300And400 },
                        { name: "≥ 400€", value: dailyStats.distribution.greaterOrEqual400 },
                        { name: "Dimanche", value: dailyStats.distribution.sunday ?? 0 },
                      ]
                }
                colors={["#ef4444", "#fbbf24", "#86efac", "#16a34a", "#9ca3af"]}
                hideSundays={hideSundays}
              />
            </CardContent>
          </Card>

          {/* KPIs */}
          <Card className="lg:col-span-1 py-3 md:py-3 xl:py-5">
            <CardHeader className="px-3 md:px-4 xl:px-5">
              <CardTitle className="text-base md:text-lg">Indicateurs</CardTitle>
              <CardDescription>Résumé financier</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 md:px-4 xl:px-5">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">Chiffre d'affaires TTC</p>
                <p className="text-2xl md:text-3xl font-bold text-emerald-600">{currencyFormatter.format(totalRevenue)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">Dépenses totales</p>
                <p className="text-2xl md:text-3xl font-bold text-red-600">{currencyFormatter.format(totalExpenses)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground">Moyenne journalière</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-600">{currencyFormatter.format(dailyStats.averageDaily)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart détaillé par jour */}
        <Card className="py-3 md:py-3 xl:py-5">
          <CardHeader className="px-3 md:px-4 xl:px-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-base md:text-lg">Entrées par jour</CardTitle>
                <CardDescription>{selectedMonth}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hide-sundays-chart"
                  checked={hideSundaysInChart}
                  onCheckedChange={(checked: boolean) => setHideSundaysInChart(checked)}
                />
                <Label htmlFor="hide-sundays-chart" className="text-xs md:text-sm cursor-pointer">
                  Masquer les dimanches
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-4 xl:px-5">
            <AppLineChart
              data={dailyRevenuesData}
              formatter={(value) => currencyFormatter.format(value)}
              thresholdLine={{ value: 300, label: "300" }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
