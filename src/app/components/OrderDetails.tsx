import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle,
  Package,
  ArrowRight,
  ScanLine,
} from 'lucide-react'
import type { Order, OrderItem } from '../types'

interface Props {
  order: Order
  onBack: () => void
  onUpdateStatus: (
    orderId: string,
    status: 'preparing' | 'ready' | 'completed'
  ) => Promise<void>
  onOpenScanner: () => void
}

const STATUS_FLOW: Record<string, { next: string; nextLabel: string; nextStatus: 'preparing' | 'ready' | 'completed' } | null> = {
  pending: { next: 'Preparar', nextLabel: 'Marcar como Preparando', nextStatus: 'preparing' },
  preparing: { next: 'Listo', nextLabel: 'Marcar como Listo', nextStatus: 'ready' },
  ready: null,
  completed: null,
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-orange-600',
  preparing: 'text-violet-600',
  ready: 'text-emerald-600',
  completed: 'text-slate-500',
}

const STATUS_ICONS = {
  pending: Clock,
  preparing: ChefHat,
  ready: CheckCircle,
  completed: Package,
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  preparing: 'Preparando',
  ready: 'Listo',
  completed: 'Completado',
}

export default function OrderDetails({ order, onBack, onUpdateStatus, onOpenScanner }: Props) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(order.status)

  useEffect(() => {
    fetchItems()
  }, [order.id])

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from('order_items')
      .select('*, menu_item:menu_items(*)')
      .eq('order_id', order.id)

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const handleStatusUpdate = async () => {
    const flow = STATUS_FLOW[currentStatus]
    if (!flow) return

    setUpdating(true)
    await onUpdateStatus(order.id, flow.nextStatus)
    setCurrentStatus(flow.nextStatus)
    setUpdating(false)
  }

  const StatusIcon = STATUS_ICONS[currentStatus as keyof typeof STATUS_ICONS] || Clock
  const flow = STATUS_FLOW[currentStatus]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-bold text-gray-800">
              Pedido #{order.pickup_code}
            </h1>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleString('es-ES')}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Estado */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <StatusIcon className={`w-8 h-8 ${STATUS_COLORS[currentStatus] || 'text-primary-600'}`} />
            <div>
              <p className="text-sm text-gray-500">Estado actual</p>
              <p className="text-lg font-bold text-gray-800">
                {STATUS_LABELS[currentStatus]}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="flex items-center gap-2 mb-6">
            {['pending', 'preparing', 'ready', 'completed'].map((step, i) => {
              const steps = ['pending', 'preparing', 'ready', 'completed']
              const stepColors = ['bg-orange-500', 'bg-violet-500', 'bg-emerald-500', 'bg-slate-400']
              const currentIndex = steps.indexOf(currentStatus)
              const isActive = i <= currentIndex
              return (
                <div key={step} className="flex-1 flex items-center gap-2">
                  <div
                    className={`h-2 flex-1 rounded-full ${
                      isActive ? stepColors[i] : 'bg-gray-200'
                    }`}
                  ></div>
                </div>
              )
            })}
          </div>

          {flow && (
            <button
              onClick={handleStatusUpdate}
              disabled={updating}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {updating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  {flow.nextLabel}
                </>
              )}
            </button>
          )}

          {currentStatus === 'ready' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-green-700 text-sm font-medium mb-3">
                Para completar este pedido, escanea el QR o introduce el código de recogida del cliente.
              </p>
              <p className="text-green-600 text-xs mb-4">
                Código de recogida: <span className="font-bold tracking-widest text-base">{order.pickup_code}</span>
              </p>
              <button
                onClick={onOpenScanner}
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-3 rounded-xl transition"
              >
                <ScanLine className="w-5 h-5" />
                Verificar con QR / Código
              </button>
            </div>
          )}
        </div>

        {/* Info cliente */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
          <p className="text-sm text-gray-500">Cliente</p>
          <p className="font-semibold text-gray-800">
            {order.user_name || 'Cliente'}
          </p>
        </div>

        {/* Items del pedido */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">Productos</h3>
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {item.menu_item?.image_url && (
                      <img
                        src={item.menu_item.image_url}
                        alt={item.menu_item?.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.menu_item?.name || 'Producto'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {item.quantity} x {item.price.toFixed(2)}€
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {(item.quantity * item.price).toFixed(2)}€
                  </span>
                </div>
              ))}

              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-bold text-primary-600">
                  {order.total.toFixed(2)}€
                </span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
