import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function FinancialIssuesChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial vs. Operational Issues</CardTitle>
        <CardDescription>Refund count vs. reprint count per month</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="refunds" fill="#ef4444" name="Refunds" />
            <Bar dataKey="reprints" fill="#f97316" name="Reprints" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
