import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Search, Plus, Tag, X, FlaskConical } from 'lucide-react'
import CustomDrinkBuilder from './CustomDrinkBuilder'
import type { MenuItem, DrinkIngredient } from '../types'

interface Props {
  onAddToCart: (item: MenuItem, ingredients?: { ingredient: DrinkIngredient; quantity: number }[]) => void
}

export default function Menu({ onAddToCart }: Props) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null)
  const [showCustomDrink, setShowCustomDrink] = useState(false)

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('available', true)
      .order('category')
      .order('name')

    if (!error && data) {
      setItems(data)
    }
    setLoading(false)
  }

  const categories = ['all', ...new Set(items.map((item) => item.category))]

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleAdd = (item: MenuItem) => {
    onAddToCart(item)
    setAddedId(item.id)
    setTimeout(() => setAddedId(null), 800)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">BEBIDAS</h2>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en la carta..."
          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
        />
      </div>

      {/* Categorías */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              selectedCategory === cat
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Tarjeta de bebida personalizada */}
          <div
            onClick={() => setShowCustomDrink(true)}
            className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-md border border-primary-400 overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer flex flex-col items-center justify-center p-6 text-white min-h-[180px]"
          >
            <FlaskConical className="w-12 h-12 mb-3 opacity-90" />
            <h3 className="text-lg font-bold">Bebida Personalizada</h3>
            <p className="text-sm text-white/80 mt-1 text-center">Elige tu alcohol y refresco favorito</p>
          </div>
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => item.image_url && setPreviewItem(item)}
              className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 ease-in-out ${item.image_url ? 'cursor-pointer' : ''}`}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-40 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary-600 whitespace-nowrap">
                    {item.price.toFixed(2)}€
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdd(item)
                  }}
                  className={`mt-3 w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition ${
                    addedId === item.id
                      ? 'bg-green-500 text-white'
                      : 'bg-primary-600 hover:bg-primary-700 text-white'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {addedId === item.id ? '¡Añadido!' : 'Añadir al carrito'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de bebida personalizada */}
      {showCustomDrink && (
        <CustomDrinkBuilder
          onAddToCart={onAddToCart}
          onClose={() => setShowCustomDrink(false)}
        />
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
            {/* Botón cerrar */}
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
              <button
                onClick={() => {
                  handleAdd(previewItem)
                  setPreviewItem(null)
                }}
                className="mt-4 w-full py-3 rounded-xl font-medium bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2 transition"
              >
                <Plus className="w-5 h-5" />
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
