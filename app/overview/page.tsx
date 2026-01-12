"use client"

import React, { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { storeRevenue } from "@/hook/revenue.store";
import { storePurchase } from "@/hook/purchase.store";
import { storeSettings } from "@/hook/settings.store";
import { Input } from "@/components/ui/input";

const fmt = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// Fonction pour obtenir le nombre de jours dans un mois
const getDaysInMonth = (monthStr: string) => {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month, 0).getDate();
};

export default function Overview() {
  const entries = storeRevenue((s) => s.entries);
  const purchases = storePurchase((s) => s.entries);
  const hideSundays = storeSettings((s) => s.hideSundays);
  
  const today = new Date();
  const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [hideSundaysInChart, setHideSundaysInChart] = useState(hideSundays);

  // Synchroniser l'état local avec le paramètre global
  useEffect(() => {
    setHideSundaysInChart(hideSundays);
  }, [hideSundays]);

  // Calculer les données par mois
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; expenses: number }>();

    entries.forEach((e) => {
      const month = e.date.slice(0, 7);
      const existing = map.get(month) || { month, revenue: 0, expenses: 0 };
      existing.revenue += e.ttc;
      map.set(month, existing);
    });

    purchases.forEach((p) => {
      const month = p.date.slice(0, 7);
      const existing = map.get(month) || { month, revenue: 0, expenses: 0 };
      existing.expenses += p.ttc;
      map.set(month, existing);
    });

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((d) => ({
        ...d,
        profit: d.revenue - d.expenses,
      }));
  }, [entries, purchases]);

  // KPIs - filtrés par mois sélectionné
  const totalRevenue = useMemo(() => 
    entries
      .filter((e) => e.date.startsWith(selectedMonth))
      .reduce((sum, e) => sum + e.ttc, 0), 
    [entries, selectedMonth]
  );
  const totalExpenses = useMemo(() => 
    purchases
      .filter((p) => p.date.startsWith(selectedMonth))
      .reduce((sum, p) => sum + p.ttc, 0), 
    [purchases, selectedMonth]
  );
  const netProfit = totalRevenue - totalExpenses;

  // Statistiques par jour du mois sélectionné
  const dailyStats = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const [year, month] = selectedMonth.split("-").map(Number);

    // Créer une map des revenus par jour
    const revenueByDay = new Map<number, number>();
    entries.forEach((e) => {
      if (e.date.startsWith(selectedMonth)) {
        const day = parseInt(e.date.split("-")[2]);
        const existing = revenueByDay.get(day) || 0;
        revenueByDay.set(day, existing + e.ttc);
      }
    });

    // Compter les jours ouverts/fermés/dimanches
    let openDays = 0;
    let closedDays = 0;
    let sundayDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = date.getDay() === 0;
      
      if (isSunday) {
        if (!hideSundays) {
          sundayDays++;
        }
        continue; // Ignorer les dimanches dans les calculs de jours ouverts/fermés si masqués
      }
      
      if (revenueByDay.has(day)) {
        openDays++;
      } else {
        closedDays++;
      }
    }

    // Distribution par catégorie
    const distribution: any = {
      zero: 0,
      lessThan300: 0,
      between300And400: 0,
      greaterOrEqual400: 0,
    };

    if (!hideSundays) {
      distribution.sunday = 0;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = date.getDay() === 0;
      
      if (isSunday && !hideSundays) {
        distribution.sunday++;
        continue;
      } else if (isSunday && hideSundays) {
        continue;
      }
      
      const revenue = revenueByDay.get(day) || 0;
      if (revenue === 0) distribution.zero++;
      else if (revenue < 300) distribution.lessThan300++;
      else if (revenue < 400) distribution.between300And400++;
      else distribution.greaterOrEqual400++;
    }

    // Moyenne journalière
    const totalMonthRevenue = Array.from(revenueByDay.values()).reduce((sum, r) => sum + r, 0);
    const averageDaily = openDays > 0 ? totalMonthRevenue / openDays : 0;

    return {
      openDays,
      closedDays,
      sundayDays,
      distribution,
      averageDaily,
    };
  }, [entries, selectedMonth, hideSundays]);

  // Données détaillées pour le chart par jour du mois sélectionné
  const dailyRevenuesData = useMemo(() => {
    const daysInMonth = getDaysInMonth(selectedMonth);
    const [year, month] = selectedMonth.split("-").map(Number);
    const data: Array<{ day: number; revenue: number }> = [];

    // Créer une map des revenus par jour pour le mois sélectionné
    const revenueByDay = new Map<number, number>();
    entries.forEach((e) => {
      if (e.date.startsWith(selectedMonth)) {
        const day = parseInt(e.date.split("-")[2]);
        const existing = revenueByDay.get(day) || 0;
        revenueByDay.set(day, existing + e.ttc);
      }
    });

    // Créer les données pour chaque jour du mois
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const isSunday = date.getDay() === 0;
      
      // Inclure les dimanches si hideSundaysInChart = false, sinon les exclure
      if (isSunday && hideSundaysInChart) continue;
      
      data.push({
        day,
        revenue: revenueByDay.get(day) || 0,
      });
    }

    return data;
  }, [entries, selectedMonth, hideSundaysInChart]);

  return (
    <main className="flex-1 overflow-auto px-6 bg-slate-50 dark:bg-slate-950">
      <h2 className="h-auto w-min mx-auto text-2xl font-bold my-4 p-2 border-2 rounded-2xl border-slate-500">SUIVI</h2>
      {/* Sélecteur de mois */}
      <div className="fixed top-2 left-70">
        <label className="text-sm text-slate-600 dark:text-slate-300 mb-2 block">Sélectionner le mois</label>
        <Input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Jours d'ouverture/fermeture */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Jours d'ouverture - BarChart */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Jours d'ouverture ({selectedMonth})</h3>
          
          {/* Légende personnalisée */}
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#10b981" }}></div>
              <span className="text-sm font-medium">Ouvert</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#ef4444" }}></div>
              <span className="text-sm font-medium">Fermé</span>
            </div>
            {!hideSundays && (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#9ca3af" }}></div>
                <span className="text-sm font-medium">Dimanche</span>
              </div>
            )}
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={
                hideSundays
                  ? [
                      { name: "Ouvert", ouvert: dailyStats.openDays, fermé: 0 },
                      { name: "Fermé", ouvert: 0, fermé: dailyStats.closedDays },
                    ]
                  : [
                      { name: "Ouvert", ouvert: dailyStats.openDays, fermé: 0, dimanche: 0 },
                      { name: "Fermé", ouvert: 0, fermé: dailyStats.closedDays, dimanche: dailyStats.sundayDays },
                    ]
              }
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={false} />
              <YAxis />
              <Tooltip />
              {!hideSundays && <Bar dataKey="dimanche" stackId="a" fill="#9ca3af" name="Dimanche" />}
              <Bar dataKey="ouvert" stackId="a" fill="#10b981" name="Ouvert" />
              <Bar dataKey="fermé" stackId="a" fill="#ef4444" name="Fermé" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution des revenus par jour - PieChart */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
          <h3 className="text-lg font-semibold mb-4">Distribution (revenus par jour)</h3>
          <div className="flex gap-6">
            {/* PieChart */}
            <div className="shrink-0">
              <ResponsiveContainer width={200} height={250}>
                <PieChart>
                  <Pie
                    data={
                      hideSundays
                        ? [
                            { name: "0€", value: dailyStats.distribution.zero },
                            { name: "< 300€", value: dailyStats.distribution.lessThan300 },
                            { name: "300-399€", value: dailyStats.distribution.between300And400 },
                            { name: "≥ 400€", value: dailyStats.distribution.greaterOrEqual400 },
                          ]
                        : [
                            { name: "0€", value: dailyStats.distribution.zero },
                            { name: "< 300€", value: dailyStats.distribution.lessThan300 },
                            { name: "300-399€", value: dailyStats.distribution.between300And400 },
                            { name: "≥ 400€", value: dailyStats.distribution.greaterOrEqual400 },
                            { name: "Dimanche", value: dailyStats.distribution.sunday },
                          ]
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#ef4444" />
                    <Cell fill="#fbbf24" />
                    <Cell fill="#86efac" />
                    <Cell fill="#16a34a" />
                    {!hideSundays && <Cell fill="#9ca3af" />}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Légende */}
            <div className="flex flex-col justify-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#ef4444" }}></div>
                <span className="text-sm">0€</span>
                <span className="text-sm font-bold ml-auto">{dailyStats.distribution.zero}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#fbbf24" }}></div>
                <span className="text-sm">{'< 300€'}</span>
                <span className="text-sm font-bold ml-auto">{dailyStats.distribution.lessThan300}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#86efac" }}></div>
                <span className="text-sm">300-399€</span>
                <span className="text-sm font-bold ml-auto">{dailyStats.distribution.between300And400}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#16a34a" }}></div>
                <span className="text-sm">{'≥ 400€'}</span>
                <span className="text-sm font-bold ml-auto">{dailyStats.distribution.greaterOrEqual400}</span>
              </div>
              {!hideSundays && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: "#9ca3af" }}></div>
                  <span className="text-sm">Dimanche</span>
                  <span className="text-sm font-bold ml-auto">{dailyStats.distribution.sunday}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KDI's */}
        <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
            <div className="text-sm text-slate-500 mb-2">Chiffre d'affaires TTC</div>
            <div className="text-4xl font-bold text-emerald-600">{fmt.format(totalRevenue)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow">
            <div className="text-sm text-slate-500 mb-2">Dépenses totales</div>
            <div className="text-4xl font-bold text-red-600">{fmt.format(totalExpenses)}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow">
            <div className="text-sm text-slate-500 mb-2">Moyenne journalière</div>
            <div className="text-4xl font-bold text-blue-600">{fmt.format(dailyStats.averageDaily)}</div>
          </div>
        </div>
      </div>

      {/* Chart détaillé par jour */}
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Entrées par jour ({selectedMonth})</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={hideSundaysInChart}
              onChange={(e) => setHideSundaysInChart(e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-slate-600 dark:text-slate-300">Masquer les dimanches</span>
          </label>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={dailyRevenuesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" label={{ value: "Jour du mois", position: "insideBottomRight", offset: -5 }} />
            <YAxis label={{ value: "Montant (€)", angle: -90, position: "insideLeft" }} />
            <Tooltip formatter={(value) => fmt.format(value as number)} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenus TTC" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
