import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../utils/supabase'
import { Clock, ChefHat, CheckCircle, Package, QrCode } from 'lucide-react'
import QRCode from 'qrcode'
import type { Order, OrderItem } from '../types'

interface Props {
  userId: string
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  preparing: {
    label: 'Preparando',
    icon: ChefHat,
    color: 'text-violet-600 bg-violet-50 border-violet-200',
  },
  ready: {
    label: 'Listo',
    icon: CheckCircle,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  completed: {
    label: 'Completado',
    icon: Package,
    color: 'text-slate-500 bg-slate-50 border-slate-200',
  },
}

export default function OrderHistory({ userId }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({})
  const [loading, setLoading] = useState(true)
  const [qrImages, setQrImages] = useState<Record<string, string>>({})
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setOrders(data)
      // Generar QR para pedidos listos
      for (const order of data) {
        if (order.status === 'ready' && !qrImages[order.id]) {
          const qrData = JSON.stringify({
            orderId: order.id,
            userId: order.user_id,
            userName: order.user_name,
            total: order.total,
          })
          const url = await QRCode.toDataURL(qrData, { width: 200, margin: 2 })
          setQrImages((prev) => ({ ...prev, [order.id]: url }))
        }
      }
    }
    setLoading(false)
  }, [userId, qrImages])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) {
      setExpandedOrder(expandedOrder === orderId ? null : orderId)
      return
    }

    const { data, error } = await supabase
      .from('order_items')
      .select('*, menu_item:menu_items(*)')
      .eq('order_id', orderId)

    if (!error && data) {
      setOrderItems((prev) => ({ ...prev, [orderId]: data }))
    }
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500">Sin pedidos todavía</h3>
        <p className="text-sm text-gray-400 mt-1">
          Cuando hagas tu primer pedido aparecerá aquí
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📜 Mis Pedidos</h2>

      <div className="space-y-4">
        {orders.map((order) => {
          const config = STATUS_CONFIG[order.status]
          const StatusIcon = config.icon

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => fetchOrderItems(order.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleString('es-ES')}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" />
                    {config.label}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">
                      Pedido #{order.pickup_code}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-600">
                    {order.total.toFixed(2)}€
                  </span>
                </div>
              </button>

              {/* Detalles expandidos */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-100 p-4">
                  {orderItems[order.id] ? (
                    <div className="space-y-2">
                      {orderItems[order.id].map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.quantity}x{' '}
                            {item.menu_item?.name || 'Producto'}
                          </span>
                          <span className="text-gray-800 font-medium">
                            {(item.price * item.quantity).toFixed(2)}€
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    </div>
                  )}

                  {/* QR para pedidos listos */}
                  {order.status === 'ready' && (
                    <div className="mt-4 text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <p className="text-sm font-medium text-green-700 mb-3 flex items-center justify-center gap-2">
                        <QrCode className="w-5 h-5" />
                        ¡Tu pedido está listo! Muestra este código
                      </p>
                      {qrImages[order.id] && (
                        <img
                          src={qrImages[order.id]}
                          alt="Código QR del pedido"
                          className="mx-auto rounded-lg"
                        />
                      )}
                      <p className="mt-3 text-2xl font-bold text-green-800 tracking-widest">
                        {order.pickup_code}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
