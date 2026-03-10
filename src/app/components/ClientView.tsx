import { useState } from 'react'
import { Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { Beer, BookOpen, ShoppingCart, ClipboardList, LogOut } from 'lucide-react'
import Menu from './Menu'
import Cart from './Cart'
import OrderHistory from './OrderHistory'
import type { UserProfile, CartItem, MenuItem } from '../types'

interface Props {
  profile: UserProfile
  onLogout: () => void
}

export default function ClientView({ profile, onLogout }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])

  const addToCart = (menuItem: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map((item) =>
          item.menuItem.id === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { menuItem, quantity: 1 }]
    })
  }

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.menuItem.id !== menuItemId))
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.menuItem.id === menuItemId ? { ...item, quantity } : item
        )
      )
    }
  }

  const clearCart = () => setCart([])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Beer className="w-7 h-7 text-primary-600" />
            <span className="font-bold text-lg text-gray-800">BarApp</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              Hola, {profile.name}
            </span>
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

      {/* Contenido */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <Routes>
          <Route index element={<Navigate to="menu" replace />} />
          <Route path="menu" element={<Menu onAddToCart={addToCart} />} />
          <Route
            path="cart"
            element={
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onClearCart={clearCart}
                userId={profile.id}
                userName={profile.name}
              />
            }
          />
          <Route path="orders" element={<OrderHistory userId={profile.id} />} />
        </Routes>
      </main>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto flex">
          <NavLink
            to="menu"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs font-medium transition ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <BookOpen className="w-6 h-6 mb-1" />
            Carta
          </NavLink>
          <NavLink
            to="cart"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs font-medium transition relative ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <div className="relative">
              <ShoppingCart className="w-6 h-6 mb-1" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {cartCount}
                </span>
              )}
            </div>
            Carrito
          </NavLink>
          <NavLink
            to="orders"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 text-xs font-medium transition ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            <ClipboardList className="w-6 h-6 mb-1" />
            Pedidos
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
