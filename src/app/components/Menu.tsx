import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { Search, Plus, Tag } from 'lucide-react'
import type { MenuItem } from '../types'

interface Props {
  onAddToCart: (item: MenuItem) => void
}

export default function Menu({ onAddToCart }: Props) {
  const [items, setItems] = useState<MenuItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<string | null>(null)

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
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📖 Carta</h2>

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
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition"
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
                  onClick={() => handleAdd(item)}
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
    </div>
  )
}
