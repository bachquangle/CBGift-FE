import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function RevenueChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue vs. Cash Flow</CardTitle>
        <CardDescription>Invoiced value vs. actual payments over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="invoiced" stroke="#3b82f6" name="Invoiced Value" strokeWidth={2} />
            <Line type="monotone" dataKey="collected" stroke="#10b981" name="Actual Payments" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
