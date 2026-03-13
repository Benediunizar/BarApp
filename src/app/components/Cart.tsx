import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase'
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, X, CreditCard, Snowflake } from 'lucide-react'
import type { CartItem, MenuItem } from '../types'

interface Props {
  items: CartItem[]
  onUpdateQuantity: (menuItemId: string, quantity: number) => void
  onToggleIce: (menuItemId: string) => void
  onClearCart: () => void
  userId: string
  userName: string
}

export default function Cart({ items, onUpdateQuantity, onToggleIce, onClearCart, userId, userName }: Props) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null)
  const [showPayment, setShowPayment] = useState(false)

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
    const orderItems: { order_id: string; menu_item_id?: string; ingredient_id?: string; quantity: number; price: number; notes?: string }[] = []
    for (const item of items) {
      if (item.ingredients && item.ingredients.length > 0) {
        for (const ing of item.ingredients) {
          orderItems.push({
            order_id: order.id,
            ingredient_id: ing.ingredient.id,
            quantity: ing.quantity * item.quantity,
            price: ing.ingredient.price,
          })
        }
      } else {
        orderItems.push({
          order_id: order.id,
          menu_item_id: item.menuItem.id,
          quantity: item.quantity,
          price: item.menuItem.price,
          ...(item.withIce === false ? { notes: 'Sin hielo' } : {}),
        })
      }
    }

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
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition"
          >
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setPreviewItem(item.menuItem)}>
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

            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
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

            {/* Toggle hielo */}
            {!item.ingredients && (
              <div className="mt-2 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onToggleIce(item.menuItem.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition shadow-sm border ${
                    item.withIce !== false
                      ? 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                      : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Snowflake className="w-4 h-4" />
                  {item.withIce !== false ? 'Con hielo' : 'Sin hielo'}
                </button>
              </div>
            )}
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
          onClick={() => setShowPayment(true)}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          Confirmar Pedido
        </button>

        <button
          onClick={onClearCart}
          className="w-full mt-3 text-red-500 hover:bg-red-50 font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Vaciar carrito
        </button>
      </div>

      {/* Modal de pago */}
      {showPayment && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !loading && setShowPayment(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-primary-600" />
                  Confirmar pago
                </h3>
                <button
                  onClick={() => !loading && setShowPayment(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lista de productos */}
              <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.menuItem.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {item.menuItem.image_url && (
                        <img
                          src={item.menuItem.image_url}
                          alt={item.menuItem.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{item.menuItem.name}</p>
                        <p className="text-gray-400">{item.quantity} x {item.menuItem.price.toFixed(2)}€</p>
                      </div>
                    </div>
                    <span className="font-semibold text-gray-800 ml-3">
                      {(item.menuItem.price * item.quantity).toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>

              {/* Separador y total */}
              <div className="border-t border-gray-200 pt-4 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Total</span>
                  <span className="text-2xl font-bold text-primary-600">{total.toFixed(2)}€</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Botones */}
              <button
                onClick={handleOrder}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pagar {total.toFixed(2)}€
                  </>
                )}
              </button>
              <button
                onClick={() => setShowPayment(false)}
                disabled={loading}
                className="w-full mt-2 text-gray-500 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de preview */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-3 right-3 z-10 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition"
              >
                <X className="w-5 h-5" />
              </button>
              {previewItem.image_url && (
                <img
                  src={previewItem.image_url}
                  alt={previewItem.name}
                  className="w-full max-h-80 object-contain bg-gray-100"
                />
              )}
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-800">{previewItem.name}</h3>
                <span className="text-xl font-bold text-primary-600 whitespace-nowrap">
                  {previewItem.price.toFixed(2)}€
                </span>
              </div>
              <span className="inline-block text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full mb-3">
                {previewItem.category}
              </span>
              <p className="text-gray-500">{previewItem.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
