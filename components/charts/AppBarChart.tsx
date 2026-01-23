"use client"

import React from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts"

interface BarChartData {
  name: string
  ouvert?: number
  fermé?: number
  dimanche?: number
}

interface AppBarChartProps {
  data: BarChartData[]
  hideSundays: boolean
}

/**
 * Composant graphique en barres pour visualiser les jours ouverts/fermés
 * @param data Données avec colonnes: name, ouvert, fermé, dimanche
 * @param hideSundays Masquer la colonne dimanche si true
 */
export default function AppBarChart({ data, hideSundays }: AppBarChartProps) {
  // Renderer pour afficher un label centré uniquement si la valeur > 0
  const renderCenteredValue = (props: Record<string, unknown>) => {
    const { value, x, y, width, height } = props as {value?: number; x?: number; y?: number; width?: number; height?: number};
    if (!value || value <= 0 || x === undefined || y === undefined || width === undefined || height === undefined) {
      return null
    }
    const cx = x + width / 2
    const cy = y + height / 2
    return (
      <text
        x={cx}
        y={cy}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
      >
        {value}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200} className="md:h-62.5">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={false} />
        <YAxis />
        {!hideSundays && (
          <Bar dataKey="dimanche" stackId="a" fill="#9ca3af" name="Dimanche">
            <LabelList dataKey="dimanche" content={renderCenteredValue as unknown as undefined} />
          </Bar>
        )}
        <Bar dataKey="ouvert" stackId="a" fill="#10b981" name="Ouvert">
          <LabelList dataKey="ouvert" content={renderCenteredValue as unknown as undefined} />
        </Bar>
        <Bar dataKey="fermé" stackId="a" fill="#ef4444" name="Fermé">
          <LabelList dataKey="fermé" content={renderCenteredValue as unknown as undefined} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
