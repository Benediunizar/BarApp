import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import {
  Beer,
  LogOut,
  Clock,
  ChefHat,
  CheckCircle,
  Package,
  RefreshCw,
  ScanLine,
} from 'lucide-react'
import OrderDetails from './OrderDetails'
import QRScanner from './QRScanner'
import type { UserProfile, Order } from '../types'

interface Props {
  profile: UserProfile
  onLogout: () => void
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    icon: Clock,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    badge: 'bg-orange-500',
  },
  preparing: {
    label: 'Preparando',
    icon: ChefHat,
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    badge: 'bg-violet-500',
  },
  ready: {
    label: 'Listo',
    icon: CheckCircle,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badge: 'bg-emerald-500',
  },
  completed: {
    label: 'Entregado',
    icon: Package,
    color: 'bg-slate-50 border-slate-200 text-slate-500',
    badge: 'bg-slate-400',
  },
}

type FilterStatus = 'all' | 'pending' | 'preparing' | 'ready' | 'completed'

function OrderList({ profile, onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showScanner, setShowScanner] = useState(false)

  const fetchOrders = useCallback(async () => {
    const query = supabase
      .from('orders')
      .select('*')
      .in('status', ['pending', 'preparing', 'ready', 'completed'])
      .order('created_at', { ascending: false })

    const { data, error } = await query
    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  const updateOrderStatus = async (
    orderId: string,
    newStatus: 'preparing' | 'ready' | 'completed'
  ) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)

    if (!error) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    }
  }

  const handleQRScan = async (data: string) => {
    // Código manual: buscar pedido por pickup_code
    if (data.startsWith('MANUAL:')) {
      const code = data.replace('MANUAL:', '')
      const order = orders.find(
        (o) => o.pickup_code === code && o.status === 'ready'
      )
      if (order) {
        await updateOrderStatus(order.id, 'completed')
        setShowScanner(false)
        fetchOrders()
      }
      return
    }

    // QR escaneado con cámara
    try {
      const parsed = JSON.parse(data)
      if (parsed.orderId) {
        await updateOrderStatus(parsed.orderId, 'completed')
        setShowScanner(false)
        fetchOrders()
      }
    } catch {
      // QR inválido
    }
  }

  const activeOrders = orders.filter((o) => o.status !== 'completed')
  const filteredOrders =
    filter === 'all' ? activeOrders : orders.filter((o) => o.status === filter)

  const counts = {
    all: activeOrders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    preparing: orders.filter((o) => o.status === 'preparing').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  }

  if (showScanner) {
    return <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
  }

  if (selectedOrder) {
    return (
      <OrderDetails
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onUpdateStatus={updateOrderStatus}
        onOpenScanner={() => { setSelectedOrder(null); setShowScanner(true) }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beer className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-lg text-gray-800">BarApp</span>
            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">
              Camarero
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(true)}
              className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition"
              title="Escanear QR"
            >
              <ScanLine className="w-5 h-5" />
            </button>
            <button
              onClick={fetchOrders}
              className="p-2 text-gray-400 hover:text-primary-600 transition"
              title="Actualizar"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          👨‍🍳 Panel de Pedidos
        </h2>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {(
            [
              { key: 'all', label: 'Todos', active: 'bg-primary-600 text-white', inactive: 'text-primary-600 border-primary-200' },
              { key: 'pending', label: 'Pendientes', active: 'bg-orange-500 text-white', inactive: 'text-orange-600 border-orange-200' },
              { key: 'preparing', label: 'Preparando', active: 'bg-violet-500 text-white', inactive: 'text-violet-600 border-violet-200' },
              { key: 'ready', label: 'Listos', active: 'bg-emerald-500 text-white', inactive: 'text-emerald-600 border-emerald-200' },
              { key: 'completed', label: 'Entregados', active: 'bg-slate-500 text-white', inactive: 'text-slate-500 border-slate-200' },
            ] as { key: FilterStatus; label: string; active: string; inactive: string }[]
          ).map(({ key, label, active, inactive }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition flex items-center gap-2 shadow-sm ${
                filter === key
                  ? `${active} shadow-md`
                  : `bg-white ${inactive} hover:bg-gray-50 border`
              }`}
            >
              {label}
              <span
                className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${
                  filter === key
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {counts[key]}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-500">
              No hay pedidos {filter !== 'all' ? 'con este estado' : ''}
            </h3>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const config =
                STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG]
              if (!config) return null
              const StatusIcon = config.icon

              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${config.badge}`}
                      ></span>
                      <span className="font-semibold text-gray-800">
                        #{order.pickup_code}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {order.user_name || 'Cliente'} •{' '}
                      {new Date(order.created_at).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="font-bold text-primary-600">
                      {order.total.toFixed(2)}€
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default function WaiterView(props: Props) {
  return (
    <Routes>
      <Route index element={<OrderList {...props} />} />
      <Route path="*" element={<Navigate to="/waiter" replace />} />
    </Routes>
  )
}
