"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

export default function IncomingOutgoingChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Incoming vs. Outgoing Orders</CardTitle>
        <CardDescription>New orders created vs. orders shipped over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="incoming" stroke="#06b6d4" name="New Orders" strokeWidth={2} />
            <Line type="monotone" dataKey="outgoing" stroke="#10b981" name="Orders Shipped" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
