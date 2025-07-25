"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, CreditCard } from "lucide-react"

interface Transaction {
  id: string
  total: number
  paymentStatus?: string | null
  paymentIntentId?: string | null
  createdAt: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true)
      setError(null)
      try {
        // Get current user
        const userRes = await fetch('/api/auth/user')
        if (!userRes.ok) throw new Error('Authentication required')
        const { user } = await userRes.json()
        // Fetch orders (transactions)
        const ordersRes = await fetch('/api/orders', {
          headers: { 'user-email': user.email }
        })
        if (!ordersRes.ok) throw new Error('Failed to fetch transactions')
        const orders = await ordersRes.json()
        setTransactions(orders.map((order: any) => ({
          id: order.id,
          total: order.total,
          paymentStatus: order.paymentStatus,
          paymentIntentId: order.paymentIntentId,
          createdAt: order.createdAt
        })))
      } catch (err: any) {
        setError(err.message || 'Failed to load transactions')
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  }
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-3xl mt-8">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Transactions</h1>
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Here you can see all your payment transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                <span className="text-gray-500">Loading transactions...</span>
              </div>
            ) : error ? (
              <div className="text-center text-red-500 py-8">{error}</div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No transactions available yet.</div>
            ) : (
              <div>
                {/* Mobile Card List */}
                <div className="flex flex-col gap-3 sm:hidden">
                  {transactions.map(tx => (
                    <div key={tx.id} className="bg-white rounded-lg border p-3 flex flex-col gap-2 shadow-sm">
                      <div className="font-semibold text-base break-all">Order ID: <span className="font-mono">{tx.id.slice(0, 8)}</span></div>
                      <div className="text-gray-700 text-xs">Amount: {formatPrice(Number(tx.total))}</div>
                      <div className="text-xs">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                          ${tx.paymentStatus === 'succeeded' ? 'bg-green-100 text-green-700' :
                            tx.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'}`}
                        >
                          <CreditCard className="h-4 w-4" />
                          {tx.paymentStatus || 'N/A'}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs">Date: {formatDate(tx.createdAt)}</div>
                      <div className="text-gray-500 text-xs break-all">Payment ID: <span className="font-mono">{tx.paymentIntentId ? tx.paymentIntentId : '-'}</span></div>
                    </div>
                  ))}
                </div>
                {/* Desktop Table */}
                <div className="overflow-x-auto hidden sm:block">
                  <table className="min-w-full text-sm md:text-base bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-blue-100 text-gray-700">
                        <th className="px-3 py-2 text-left">Order ID</th>
                        <th className="px-3 py-2 text-left">Amount</th>
                        <th className="px-3 py-2 text-left">Status</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Payment ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map(tx => (
                        <tr key={tx.id} className="border-b hover:bg-blue-50 transition">
                          <td className="px-3 py-2 font-mono">{tx.id.slice(0, 8)}</td>
                          <td className="px-3 py-2">{formatPrice(Number(tx.total))}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium
                              ${tx.paymentStatus === 'succeeded' ? 'bg-green-100 text-green-700' :
                                tx.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'}`}
                            >
                              <CreditCard className="h-4 w-4" />
                              {tx.paymentStatus || 'N/A'}
                            </span>
                          </td>
                          <td className="px-3 py-2">{formatDate(tx.createdAt)}</td>
                          <td className="px-3 py-2 font-mono">{tx.paymentIntentId ? tx.paymentIntentId : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 