'use client'

import { useEffect, useState } from 'react';

interface Order {
  id: string;
  userId: string;
  status: string;
  shippingAddress: any;
  total: number;
  orderItems: any[];
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string; email: string };
}

const ORDER_STATUSES = ['RECEIVED', 'COMPLETED', 'FAILED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsStatus, setDetailsStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setError(null);
      try {
        const basicAuth = btoa('admin:password123'); // Use your real admin credentials
        const res = await fetch('/api/admin/orders', {
          headers: {
            'Authorization': `Basic ${basicAuth}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching orders');
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update order status');
      setOrders(orders => orders.map(order => order.id === orderId ? { ...order, status: newStatus } : order));
      setSuccess('Order status updated');
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
        setDetailsStatus(newStatus);
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setUpdating(null);
    }
  };

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsStatus(order.status);
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setDetailsStatus(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Order Management</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="overflow-x-auto rounded-lg bg-white border border-gray-200">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-gray-100 text-gray-800">
              <th className="p-3 text-left font-medium border-b border-gray-200 rounded-tl-lg">Order ID</th>
              <th className="p-3 text-left font-medium border-b border-gray-200">User ID</th>
              <th className="p-3 text-left font-medium border-b border-gray-200">Status</th>
              <th className="p-3 text-left font-medium border-b border-gray-200">Total</th>
              <th className="p-3 text-left font-medium border-b border-gray-200">Created</th>
              <th className="p-3 text-left font-medium border-b border-gray-200 rounded-tr-lg">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr
                key={order.id}
                className={
                  `${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`
                }
              >
                <td className="p-3 font-mono text-xs text-gray-900">{order.id}</td>
                <td className="p-3 text-gray-800">{order.userId}</td>
                <td className="p-3 text-gray-900 font-semibold">{order.status}</td>
                <td className="p-3 text-gray-900">₹{order.total}</td>
                <td className="p-3 text-gray-600 text-xs">{new Date(order.createdAt).toLocaleString()}</td>
                <td className="p-3 flex gap-2 items-center">
                  <button
                    className="px-3 py-1 bg-gray-800 text-white rounded hover:bg-gray-900 transition"
                    onClick={() => openDetails(order)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal/Section */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl relative border border-gray-200">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={closeDetails}
              aria-label="Close"
            >
              ×
            </button>
            <div className="mb-6">
              <h2 className="text-2xl font-extrabold text-blue-700 mb-1">Order Details</h2>
              <div className="text-gray-500 text-sm">Order placed on {new Date(selectedOrder.createdAt).toLocaleString()}</div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-gray-700">Order ID:</span> <span className="text-gray-900">{selectedOrder.id}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">User:</span> <span className="text-gray-900">{selectedOrder.user?.name || selectedOrder.userId} ({selectedOrder.user?.email || ''})</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Status:</span>{' '}
                <select
                  value={detailsStatus || selectedOrder.status}
                  onChange={e => {
                    setDetailsStatus(e.target.value);
                    handleStatusChange(selectedOrder.id, e.target.value);
                  }}
                  disabled={updating === selectedOrder.id}
                  className="border rounded px-2 py-1 ml-2"
                >
                  {ORDER_STATUSES.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Total:</span> <span className="text-gray-900">₹{selectedOrder.total}</span>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Shipping Address:</span>
                <div className="ml-4 text-gray-700 text-sm mt-1">
                  {typeof selectedOrder.shippingAddress === 'object' ? (
                    <>
                      {selectedOrder.shippingAddress.fullName}<br />
                      {selectedOrder.shippingAddress.addressLine1}<br />
                      {selectedOrder.shippingAddress.addressLine2 && <>{selectedOrder.shippingAddress.addressLine2}<br /></>}
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.postalCode}<br />
                      Phone: {selectedOrder.shippingAddress.phone}
                    </>
                  ) : (
                    selectedOrder.shippingAddress
                  )}
                </div>
              </div>
              <div>
                <span className="font-semibold text-gray-700">Items:</span>
                <ul className="ml-6 mt-1 space-y-1">
                  {selectedOrder.orderItems.map((item, idx) => (
                    <li key={idx} className="text-gray-800">
                      {item.product?.name || 'Product'} x {item.quantity} - ₹{item.itemTotal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
