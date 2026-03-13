import { useState, useEffect } from 'react'
import { X, Wine, GlassWater, Plus, Minus, FlaskConical, Snowflake } from 'lucide-react'
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

interface SelectedItem {
  ingredient: DrinkIngredient
  quantity: number
}

export default function CustomDrinkBuilder({ onAddToCart, onClose }: Props) {
  const [tab, setTab] = useState<'alcohol' | 'mixer'>('alcohol')
  const [ingredients, setIngredients] = useState<DrinkIngredient[]>([])
  const [selectedAlcohols, setSelectedAlcohols] = useState<SelectedItem[]>([])
  const [selectedMixers, setSelectedMixers] = useState<SelectedItem[]>([])
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

  const toggleItem = (
    ingredient: DrinkIngredient,
    list: SelectedItem[],
    setList: React.Dispatch<React.SetStateAction<SelectedItem[]>>
  ) => {
    const existing = list.find((s) => s.ingredient.id === ingredient.id)
    if (existing) {
      setList(list.filter((s) => s.ingredient.id !== ingredient.id))
    } else {
      setList([...list, { ingredient, quantity: 1 }])
    }
  }

  const updateItemQty = (
    ingredientId: string,
    delta: number,
    list: SelectedItem[],
    setList: React.Dispatch<React.SetStateAction<SelectedItem[]>>
  ) => {
    setList(
      list.flatMap((s) => {
        if (s.ingredient.id === ingredientId) {
          const newQty = s.quantity + delta
          return newQty <= 0 ? [] : [{ ...s, quantity: newQty }]
        }
        return [s]
      })
    )
  }

  const totalPrice = [...selectedAlcohols, ...selectedMixers].reduce(
    (sum, s) => sum + s.ingredient.price * s.quantity,
    0
  )

  const totalItems = selectedAlcohols.length + selectedMixers.length

  const handleConfirm = () => {
    const allSelected = [...selectedAlcohols, ...selectedMixers]
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

  const renderItemList = (
    items: DrinkIngredient[],
    selected: SelectedItem[],
    setSelected: React.Dispatch<React.SetStateAction<SelectedItem[]>>
  ) => (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
      {items.length === 0 ? (
        <p className="text-gray-400 text-center col-span-full py-8">
          No hay productos en esta categoría
        </p>
      ) : (
        items.map((ingredient) => {
          const sel = selected.find((s) => s.ingredient.id === ingredient.id)
          const active = !!sel
          return (
            <div
              key={ingredient.id}
              className={`rounded-xl border-2 p-3 transition-all cursor-pointer ${
                active
                  ? 'border-primary-500 bg-primary-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => toggleItem(ingredient, selected, setSelected)}
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
                <span className="font-bold text-primary-600 text-sm whitespace-nowrap">
                  {ingredient.price.toFixed(2)}€
                </span>
              </div>
              {active && sel && (
                <div
                  className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-primary-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() =>
                      updateItemQty(ingredient.id, -1, selected, setSelected)
                    }
                    className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center hover:bg-primary-200 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-primary-700 text-sm w-6 text-center">
                    {sel.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateItemQty(ingredient.id, 1, selected, setSelected)
                    }
                    className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center hover:bg-primary-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
            {selectedAlcohols.length > 0 && (
              <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {selectedAlcohols.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('mixer')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition border-b-2 ${
              tab === 'mixer'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
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
            renderItemList(alcoholItems, selectedAlcohols, setSelectedAlcohols)
          ) : (
            renderItemList(mixerItems, selectedMixers, setSelectedMixers)
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
            disabled={totalItems === 0}
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
