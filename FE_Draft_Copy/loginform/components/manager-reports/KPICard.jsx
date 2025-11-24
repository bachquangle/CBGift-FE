import { Card, CardContent } from "../ui/card"
import { TrendingUp } from "lucide-react"

export default function KPICard({ title, value, subtitle, icon: Icon, trend, color = "blue" }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
    orange: "bg-orange-50 text-orange-700",
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-green-600">
            <TrendingUp className="h-4 w-4" />
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
