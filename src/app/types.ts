export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  available: boolean
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
}

export interface Order {
  id: string
  user_id: string
  status: 'pending' | 'preparing' | 'ready' | 'completed'
  total: number
  pickup_code: string
  created_at: string
  user_name?: string
  items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  price: number
  menu_item?: MenuItem
}

export interface UserProfile {
  id: string
  email: string
  name: string
  role: 'client' | 'waiter'
}
