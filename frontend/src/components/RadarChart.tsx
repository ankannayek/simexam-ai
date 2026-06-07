"use client"
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts"
import { EvaluationResult } from "../types/index"

interface Props {
  scores: EvaluationResult
}

export function RadarChart({ scores }: Props) {
  const data = [
    { metric: "Technical", score: scores.technicalAccuracy },
    { metric: "Adaptability", score: scores.adaptability },
    { metric: "Communication", score: scores.communication },
    { metric: "Efficiency", score: scores.efficiency },
  ]

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RechartsRadar data={data} outerRadius="75%">
        <PolarGrid stroke="#2a2a2a" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "#888", fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#555", fontSize: 10 }} tickCount={6} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.35}
          animationBegin={0}
          animationDuration={1200}
        />
      </RechartsRadar>
    </ResponsiveContainer>
  )
}
