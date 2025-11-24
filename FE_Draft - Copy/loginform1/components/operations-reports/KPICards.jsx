"use client"

import { Card, CardContent } from "../ui/card"
import { Package, Truck, AlertOctagon, Clock } from "lucide-react"

export default function KPICards({ kpis }) {
  const cards = [
    {
      title: "Total Order Volume",
      value: kpis.totalOrders,
      subtitle: "Orders received",
      icon: Package,
      color: "bg-blue-50 text-blue-600",
      borderColor: "border-l-4 border-blue-500",
    },
    {
      title: "Production Velocity",
      value: `${kpis.productionVelocity.toFixed(1)}`,
      subtitle: "Orders/day",
      icon: Truck,
      color: "bg-teal-50 text-teal-600",
      borderColor: "border-l-4 border-teal-500",
    },
    {
      title: "Backlog (WIP)",
      value: kpis.backlog,
      subtitle: "Orders in progress",
      icon: AlertOctagon,
      color: "bg-orange-50 text-orange-600",
      borderColor: "border-l-4 border-orange-500",
    },
    {
      title: "Avg. Fulfillment Time",
      value: `${kpis.avgFulfillmentTime.toFixed(1)} days`,
      subtitle: "Created to shipped",
      icon: Clock,
      color: "bg-green-50 text-green-600",
      borderColor: "border-l-4 border-green-500",
    },
  ]

  return (
    <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <Card key={index} className={card.borderColor}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{card.value}</p>
                  <p className="mt-1 text-xs text-gray-500">{card.subtitle}</p>
                </div>
                <div className={`rounded-lg p-3 ${card.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
