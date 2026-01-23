"use client"

import React, { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface PieChartData {
  name: string
  value: number
  [key: string]: string | number
}

interface AppPieChartProps {
  data: PieChartData[]
  colors: string[]
  hideSundays: boolean
}

/**
 * Composant graphique en camembert (donut)
 * Affiche la distribution des données avec légende centrée
 */
export default function AppPieChart({ data, colors }: AppPieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  const _legendData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        percent: total > 0 ? Math.round((item.value / total) * 100) : 0,
      })),
    [data, total]
  )

  const renderLabel = ({
    value,
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
  }: {
    value?: number
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
  }) => {
    if (
      !value ||
      value <= 0 ||
      cx === undefined ||
      cy === undefined ||
      midAngle === undefined ||
      innerRadius === undefined ||
      outerRadius === undefined
    ) {
      return null
    }

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={700}
      >
        {value}
      </text>
    )
  }

  return (
    <div className="relative h-60 w-full md:h-65">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="80%"
            outerRadius="100%"
            dataKey="value"
            labelLine={false}
            label={renderLabel}
            isAnimationActive={false}
          >
            {colors.map((color, index) => (
              <Cell key={`cell-${index}`} fill={color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Légende centrée avec labels et couleurs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm" style={{ backgroundColor: colors[index] }} />
              <span className="text-xs font-medium md:text-sm">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
