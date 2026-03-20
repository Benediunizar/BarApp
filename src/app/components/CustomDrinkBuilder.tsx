import { useState, useEffect } from 'react'
import { X, Wine, GlassWater, Plus, FlaskConical, Snowflake } from 'lucide-react'
import { supabase } from '../utils/supabase'
import type { DrinkIngredient, MenuItem } from '../types'

interface IngredientSelection {
  ingredient: DrinkIngredient
  quantity: number
}

interface Props {
  onAddToCart: (item: MenuItem, ingredients: IngredientSelection[]) => void
  onClose: () => void
}

type DrinkStyle = 'solo' | 'mixer' | null

export default function CustomDrinkBuilder({ onAddToCart, onClose }: Props) {
  const [tab, setTab] = useState<'alcohol' | 'mixer'>('alcohol')
  const [ingredients, setIngredients] = useState<DrinkIngredient[]>([])
  const [selectedAlcohol, setSelectedAlcohol] = useState<DrinkIngredient | null>(null)
  const [drinkStyle, setDrinkStyle] = useState<DrinkStyle>(null)
  const [selectedMixers, setSelectedMixers] = useState<DrinkIngredient[]>([])
  const [withIce, setWithIce] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchIngredients = async () => {
      const { data } = await supabase
        .from('drink_ingredients')
        .select('*')
        .eq('available', true)
        .order('name')
      if (data) setIngredients(data)
      setLoading(false)
    }
    fetchIngredients()
  }, [])

  const alcoholItems = ingredients.filter((i) => i.type === 'alcohol')
  const mixerItems = ingredients.filter((i) => i.type === 'mixer')

  const alcoholLocked = !!selectedAlcohol

  const totalPrice =
    (selectedAlcohol?.price || 0) +
    (drinkStyle === 'mixer'
      ? selectedMixers.reduce((sum, m) => sum + (m.price || 0), 0)
      : 0)

  const totalItems = (selectedAlcohol ? 1 : 0) +
    (drinkStyle === 'mixer' ? selectedMixers.length : 0)

  const handleConfirm = () => {
    if (!selectedAlcohol || drinkStyle === null) return
    if (drinkStyle === 'mixer' && selectedMixers.length === 0) return

    const allSelected: IngredientSelection[] = [
      { ingredient: selectedAlcohol, quantity: 1 },
      ...(drinkStyle === 'mixer'
        ? selectedMixers.map((m) => ({ ingredient: m, quantity: 1 }))
        : []),
    ]

    const names = allSelected.map((s) => s.ingredient.name).join(' + ')
    const iceSuffix = withIce ? '' : ' (sin hielo)'

    const virtualMenuItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: `🧪 ${names}${iceSuffix}`,
      description: 'Bebida personalizada',
      price: totalPrice,
      image_url: '',
      category: 'Bebida Personalizada',
      available: true,
    }

    onAddToCart(virtualMenuItem, allSelected)
    onClose()
  }

  const renderAlcoholList = () => (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {alcoholItems.length === 0 ? (
        <p className="text-gray-400 text-center col-span-full py-8">
          No hay productos en esta categoría
        </p>
      ) : (
        alcoholItems.map((ingredient) => {
          const active = selectedAlcohol?.id === ingredient.id
          const disabled = alcoholLocked && !active
          return (
            <div
              key={ingredient.id}
              className={`rounded-xl border-2 p-3 transition-all ${
                disabled ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' : 'cursor-pointer'
              } ${
                active
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                if (disabled) return
                if (active && alcoholLocked) {
                  // Desbloquear (por si se equivoca)
                  setSelectedAlcohol(null)
                  setDrinkStyle(null)
                  setSelectedMixers([])
                  return
                }
                setSelectedAlcohol(ingredient)
                setDrinkStyle(null)
                setSelectedMixers([])
                setTab('alcohol')
              }}
            >
              <div className="flex items-center gap-3">
                {ingredient.image_url && (
                  <img
                    src={ingredient.image_url}
                    alt={ingredient.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm truncate">
                    {ingredient.name}
                  </h4>
                  {active && drinkStyle !== null && (
                    <p className="text-xs text-emerald-700 mt-0.5">Alcohol seleccionado</p>
                  )}
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ${active ? 'text-emerald-700' : 'text-primary-600'}`}>
                  {ingredient.price.toFixed(2)}€
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  const renderMixerList = () => (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {mixerItems.length === 0 ? (
        <p className="text-gray-400 text-center col-span-full py-8">
          No hay productos en esta categoría
        </p>
      ) : (
        mixerItems.map((ingredient) => {
          const active = selectedMixers.some((m) => m.id === ingredient.id)
          return (
            <div
              key={ingredient.id}
              className={`rounded-xl border-2 p-3 transition-all cursor-pointer ${
                active
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => {
                if (drinkStyle !== 'mixer') return
                setSelectedMixers((prev) => {
                  const exists = prev.some((m) => m.id === ingredient.id)
                  if (exists) return prev.filter((m) => m.id !== ingredient.id)
                  return [...prev, ingredient]
                })
              }}
            >
              <div className="flex items-center gap-3">
                {ingredient.image_url && (
                  <img
                    src={ingredient.image_url}
                    alt={ingredient.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-800 text-sm truncate">
                    {ingredient.name}
                  </h4>
                </div>
                <span className={`font-bold text-sm whitespace-nowrap ${active ? 'text-emerald-700' : 'text-primary-600'}`}>
                  {ingredient.price.toFixed(2)}€
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-800">
              Bebida Personalizada
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTab('alcohol')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${
              tab === 'alcohol'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Wine className="w-4 h-4" />
            Alcohol
            {selectedAlcohol && (
              <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                1
              </span>
            )}
          </button>
          <button
            onClick={() => {
              if (selectedAlcohol && drinkStyle === 'mixer') setTab('mixer')
            }}
            disabled={!selectedAlcohol || drinkStyle !== 'mixer'}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              tab === 'mixer'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400'
            }`}
          >
            <GlassWater className="w-4 h-4" />
            Refrescos
            {selectedMixers.length > 0 && (
              <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {selectedMixers.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : tab === 'alcohol' ? (
            <div>
              {renderAlcoholList()}

              {selectedAlcohol && (
                <div className="mt-4 p-4 rounded-2xl border border-gray-200 bg-white">
                  <p className="text-sm font-semibold text-gray-800 mb-3">
                    ¿Solo o con refresco?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDrinkStyle('solo')
                        setSelectedMixers([])
                        setTab('alcohol')
                      }}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition ${
                        drinkStyle === 'solo'
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Solo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrinkStyle('mixer')
                        setTab('mixer')
                      }}
                      className={`px-4 py-3 rounded-xl border text-sm font-medium transition ${
                        drinkStyle === 'mixer'
                          ? 'bg-emerald-500 border-emerald-600 text-white'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Con refresco
                    </button>
                  </div>
                  {drinkStyle === null && (
                    <p className="text-xs text-gray-400 mt-2">
                      Selecciona una opción para continuar.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              {drinkStyle !== 'mixer' ? (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-sm">
                    Primero elige un alcohol y pulsa “Con refresco”.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-500 mb-3">
                    Puedes elegir varios refrescos, pero sin repetir el mismo.
                  </p>
                  {renderMixerList()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          {/* Toggle hielo */}
          <button
            onClick={() => setWithIce(!withIce)}
            className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl mb-3 transition border ${
              withIce
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-gray-100 border-gray-200 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4" />
              <span className="text-sm font-medium">Con hielo</span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-0.5 ${
              withIce ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
            }`}>
              <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
            </div>
          </button>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">
              {totalItems} producto{totalItems !== 1 ? 's' : ''} seleccionado
              {totalItems !== 1 ? 's' : ''}
            </span>
            <span className="text-lg font-bold text-primary-600">
              {totalPrice.toFixed(2)}€
            </span>
          </div>
          <button
            onClick={handleConfirm}
            disabled={
              !selectedAlcohol ||
              drinkStyle === null ||
              (drinkStyle === 'mixer' && selectedMixers.length === 0)
            }
            className="w-full py-3 rounded-xl font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Añadir al carrito
          </button>
        </div>
      </div>
    </div>
  )
}
