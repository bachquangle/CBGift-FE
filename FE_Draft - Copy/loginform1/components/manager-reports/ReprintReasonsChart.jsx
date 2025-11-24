import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

export default function ReprintReasonsChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reprint Reasons Breakdown</CardTitle>
        <CardDescription>Distribution of reprint issues</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
