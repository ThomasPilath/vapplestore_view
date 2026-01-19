"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Button } from "@/components/ui/button"

interface AppLineChartProps {
  data: Array<{
    day: number
    revenue: number
  }>
  formatter: (value: number) => string
  thresholdLine?: {
    value: number
    label: string
  }
}

// Media query hook using modern listeners only (no deprecated addListener/removeListener)
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(query)
    const handleChange = (event: MediaQueryListEvent) => setMatches(event.matches)

    setMatches(mq.matches)
    mq.addEventListener("change", handleChange)

    return () => mq.removeEventListener("change", handleChange)
  }, [query])

  return matches
}

export default function AppLineChart({
  data,
  formatter,
  thresholdLine = { value: 300, label: "300" },
}: AppLineChartProps) {
  const [weekIndex, setWeekIndex] = useState(0)
  const isMobile = useMediaQuery("(max-width: 768px)")

  useEffect(() => {
    if (!isMobile) {
      setWeekIndex(0)
      return
    }

    const weeks = Math.max(1, Math.ceil(data.length / 7))
    setWeekIndex((prev) => Math.min(prev, weeks - 1))
  }, [data.length, isMobile])

  const weeks = useMemo(() => Math.max(1, Math.ceil(data.length / 7)), [data.length])

  const displayData = useMemo(() => {
    if (!isMobile) return data
    const start = weekIndex * 7
    return data.slice(start, start + 7)
  }, [data, isMobile, weekIndex])

  const canPrev = weekIndex > 0
  const canNext = weekIndex < weeks - 1

  const rangeLabel = useMemo(() => {
    if (!isMobile || displayData.length === 0) return ""
    const startDay = displayData[0].day
    const endDay = displayData[displayData.length - 1].day
    return `Semaine du ${startDay} au ${endDay}`
  }, [displayData, isMobile, weekIndex])

  return (
    <div className="w-full">
      {isMobile && (
        <div className="mb-3 flex items-center justify-between gap-2 md:hidden">
          <Button variant="ghost" size="sm" onClick={() => setWeekIndex((v) => Math.max(0, v - 1))} disabled={!canPrev}>
            ←
          </Button>
          <span className="text-xs font-medium">{rangeLabel}</span>
          <Button variant="ghost" size="sm" onClick={() => setWeekIndex((v) => Math.min(weeks - 1, v + 1))} disabled={!canNext}>
            →
          </Button>
        </div>
      )}

      <ResponsiveContainer width="100%" height={280} className="md:h-100">
        <LineChart data={displayData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            label={{ value: "Jour du mois", position: "insideBottomRight", offset: -5 }}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            label={{ value: "Montant (€)", angle: -90, position: "insideLeft" }}
            tick={{ fontSize: 12 }}
            domain={[0, 800]}
            ticks={[200, 400, 600, 800]}
          />
          <Tooltip formatter={(value) => formatter(value as number)} />
          <Legend wrapperStyle={{ fontSize: '14px' }} />
          {thresholdLine && (
            <ReferenceLine
              y={thresholdLine.value}
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{
                value: thresholdLine.label,
                position: "left",
                fill: "#3b82f6",
                fontSize: 12,
              }}
            />
          )}
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            name="Revenus TTC"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
