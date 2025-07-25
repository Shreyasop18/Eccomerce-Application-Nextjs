'use client'

import { useEffect, useState } from 'react';
import clsx from 'clsx';

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
    <div className="w-full px-0 sm:px-4 md:px-6 md:max-w-5xl md:mx-auto">
      <h1 className="text-lg sm:text-2xl font-bold mb-4">Order Management</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">{success}</div>}
      <div className="w-full overflow-x-auto rounded-lg bg-white border border-gray-200">
        {/* Mobile Card List */}
        <div className="flex flex-col gap-3 sm:hidden p-2">
          {orders.map((order, idx) => (
            <div key={order.id} className={clsx('bg-white rounded-lg border p-3 flex flex-col gap-2 shadow-sm', idx % 2 !== 0 && 'bg-gray-50')}> 
              <div className="font-semibold text-base break-all">Order ID: <span className="font-mono">{order.id}</span></div>
              <div className="text-gray-500 text-xs break-all">User ID: {order.userId}</div>
              <div className="text-gray-700 text-xs">Status: <span className="font-semibold">{order.status}</span></div>
              <div className="text-gray-700 text-xs">Total: ₹{order.total}</div>
              <div className="text-gray-600 text-xs break-all">Created: {new Date(order.createdAt).toLocaleString()}</div>
              <div className="flex gap-2 mt-1">
                <button
                  className="flex-1 w-full px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition text-xs min-h-[36px]"
                  onClick={() => openDetails(order)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden sm:block">
          <table className="w-full min-w-[700px] border-separate border-spacing-0 text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th className="p-2 sm:p-3 text-left font-medium border-b border-gray-200 rounded-tl-lg">Order ID</th>
                <th className="p-2 sm:p-3 text-left font-medium border-b border-gray-200">User ID</th>
                <th className="p-2 sm:p-3 text-left font-medium border-b border-gray-200">Status</th>
                <th className="p-2 sm:p-3 text-left font-medium border-b border-gray-200">Total</th>
                <th className="p-2 sm:p-3 text-left font-medium border-b border-gray-200">Created</th>
                <th className="p-2 sm:p-3 text-left font-medium border-b border-gray-200 rounded-tr-lg">Action</th>
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
                  <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm text-gray-900 break-all max-w-[120px]">{order.id}</td>
                  <td className="p-2 sm:p-3 text-gray-800 break-all max-w-[100px]">{order.userId}</td>
                  <td className="p-2 sm:p-3 text-gray-900 font-semibold break-all">{order.status}</td>
                  <td className="p-2 sm:p-3 text-gray-900 break-all">₹{order.total}</td>
                  <td className="p-2 sm:p-3 text-gray-600 text-xs sm:text-sm break-all">{new Date(order.createdAt).toLocaleString()}</td>
                  <td className="p-2 sm:p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center min-w-[100px]">
                    <button
                      className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 transition text-sm w-full sm:w-auto min-h-[40px]"
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
      </div>

      {/* Order Details Modal/Section */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-1 sm:px-0">
          <div className="bg-white rounded-2xl shadow-2xl p-2 sm:p-8 w-full max-w-xs sm:max-w-xl relative border border-gray-200 mx-auto max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 sm:top-3 sm:right-3 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={closeDetails}
              aria-label="Close"
            >
              ×
            </button>
            {selectedOrder && (
              <>
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-extrabold text-blue-700 mb-1">Order Details</h2>
                  <div className="text-gray-500 text-xs sm:text-sm">Order placed on {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <span className="font-semibold text-gray-700">Order ID:</span> <span className="text-gray-900 break-all">{selectedOrder.id}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">User:</span> <span className="text-gray-900 break-all">{selectedOrder.user?.name || selectedOrder.userId} {selectedOrder.user?.email && (<span className='break-all'>({selectedOrder.user.email})</span>)}</span>
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
                      className="border rounded px-2 py-2 ml-0 sm:ml-2 min-w-[100px] text-sm w-full sm:w-auto"
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
                    <div className="ml-2 sm:ml-4 text-gray-700 text-xs sm:text-sm mt-1 break-all">
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
                    <ul className="ml-2 sm:ml-6 mt-1 space-y-1">
                      {selectedOrder.orderItems.map((item, idx) => (
                        <li key={idx} className="text-gray-800 text-xs sm:text-sm break-all">
                          {item.product?.name || 'Product'} x {item.quantity} - ₹{item.itemTotal}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
