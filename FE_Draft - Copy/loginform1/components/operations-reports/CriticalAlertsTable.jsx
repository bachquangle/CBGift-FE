"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { AlertCircle } from "lucide-react"

export default function CriticalAlertsTable({ data }) {
  const getStatusColor = (days) => {
    if (days > 5) return "bg-red-100 text-red-800"
    if (days > 3) return "bg-orange-100 text-orange-800"
    return "bg-yellow-100 text-yellow-800"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Critical Alerts</CardTitle>
        <CardDescription>Orders stuck in current status for more than 3 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Order ID</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Days in Status</th>
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Seller</th>
                <th className="px-4 py-2 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{order.id}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-3 py-1 font-semibold ${getStatusColor(order.daysInStatus)}`}
                    >
                      <AlertCircle className="mr-1 inline h-4 w-4" />
                      {order.daysInStatus} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{order.seller}</td>
                  <td className="px-4 py-3 text-center">
                    <Button size="sm" variant="outline" className="bg-transparent hover:bg-blue-50">
                      Expedite
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
