import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"

export default function TopSellersTable({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Seller Performance</CardTitle>
        <CardDescription>Seller rankings by revenue and metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2 text-left font-semibold text-gray-700">Seller</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Orders</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Revenue</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Debt</th>
                <th className="px-4 py-2 text-right font-semibold text-gray-700">Issue %</th>
              </tr>
            </thead>
            <tbody>
              {data.map((seller) => (
                <tr key={seller.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{seller.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{seller.orders}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    ${seller.revenue.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-block rounded-full bg-red-100 px-2 py-1 text-red-700">
                      ${seller.debt.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-1 ${
                        seller.issueRate > 10 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {seller.issueRate}%
                    </span>
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
