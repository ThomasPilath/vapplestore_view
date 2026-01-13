"use client"

import React, { useMemo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface AppPieChartProps {
  data: Array<{
    name: string
    value: number
  }>
  colors: string[]
  hideSundays: boolean
}

export default function AppPieChart({ data, colors, hideSundays }: AppPieChartProps) {
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data])

  const legendData = useMemo(
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
    if (!value || value <= 0 || cx === undefined || cy === undefined || midAngle === undefined || innerRadius === undefined || outerRadius === undefined) {
      return null
    }

    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)

    return (
      <text x={x} y={y} fill="#ffffff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
        {value}
      </text>
    )
  }

  return (
    <div className="w-full h-60 md:h-65 relative">
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
      
      {/* Labels centrés avec design inspiré de la légende */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center gap-2">
          {data.map((item, index) => (
            <div key={item.name} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span className="text-xs md:text-sm font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
