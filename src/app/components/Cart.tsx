import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft } from 'lucide-react'
import type { CartItem } from '../types'

interface Props {
  items: CartItem[]
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onClearCart: () => void
  userId: string
  userName: string
}

export default function Cart({ items, onUpdateQuantity, onClearCart, userId, userName }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const total = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  )

  const handleOrder = async () => {
    if (items.length === 0) return
    setError('')
    setLoading(true)

    // Generar código de recogida único (6 dígitos)
    const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Crear pedido
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        status: 'pending',
        total,
        pickup_code: pickupCode,
        user_name: userName,
      })
      .select()
      .single()

    if (orderError || !order) {
      setError('Error al crear el pedido. Inténtalo de nuevo.')
      setLoading(false)
      return
    }

    // Crear items del pedido
    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItem.id,
      quantity: item.quantity,
      price: item.menuItem.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    setLoading(false)

    if (itemsError) {
      setError('Error al guardar los productos del pedido.')
      return
    }

    onClearCart()
    navigate('/client/orders')
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500">Tu carrito está vacío</h3>
        <p className="text-sm text-gray-400 mt-1">Añade productos desde la carta</p>
        <button
          onClick={() => navigate('/client/menu')}
          className="mt-6 inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver Carta
        </button>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">🛒 Carrito</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div
            key={item.menuItem.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4"
          >
            {item.menuItem.image_url && (
              <img
                src={item.menuItem.image_url}
                alt={item.menuItem.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800 truncate">
                {item.menuItem.name}
              </h4>
              <p className="text-sm text-primary-600 font-semibold">
                {item.menuItem.price.toFixed(2)}€
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  onUpdateQuantity(item.menuItem.id, item.quantity - 1)
                }
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition text-gray-600"
              >
                {item.quantity === 1 ? (
                  <Trash2 className="w-4 h-4 text-red-500" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() =>
                  onUpdateQuantity(item.menuItem.id, item.quantity + 1)
                }
                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-100 hover:bg-primary-200 transition text-primary-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <span className="font-bold text-gray-800 w-16 text-right">
              {(item.menuItem.price * item.quantity).toFixed(2)}€
            </span>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500">Productos</span>
          <span className="text-gray-800">{items.reduce((s, i) => s + i.quantity, 0)} uds.</span>
        </div>
        <div className="flex justify-between items-center mb-6 text-lg">
          <span className="font-semibold text-gray-800">Total</span>
          <span className="font-bold text-primary-600">{total.toFixed(2)}€</span>
        </div>

        <button
          onClick={handleOrder}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5" />
              Confirmar Pedido
            </>
          )}
        </button>

        <button
          onClick={onClearCart}
          className="w-full mt-3 text-red-500 hover:bg-red-50 font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Vaciar carrito
        </button>
      </div>
    </div>
  )
}
