// Supabase Edge Function - Servidor principal con Hono
// Deploy: supabase functions deploy server

import { Hono } from 'https://deno.land/x/hono@v3.12.0/mod.ts'
import { cors } from 'https://deno.land/x/hono@v3.12.0/middleware.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const app = new Hono()

// CORS middleware
app.use('*', cors())

// Helper: crear cliente Supabase con el token del usuario
function getSupabaseClient(authHeader: string | undefined) {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  )
}

// GET /menu - Obtener carta del bar
app.get('/server/menu', async (c) => {
  const supabase = getSupabaseClient(c.req.header('Authorization'))

  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .order('category')
    .order('name')

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// POST /orders - Crear pedido
app.post('/server/orders', async (c) => {
  const supabase = getSupabaseClient(c.req.header('Authorization'))
  const body = await c.req.json()

  const { user_id, items, user_name } = body

  if (!user_id || !items || items.length === 0) {
    return c.json({ error: 'Faltan datos del pedido' }, 400)
  }

  const total = items.reduce(
    (sum: number, item: { price: number; quantity: number }) =>
      sum + item.price * item.quantity,
    0
  )

  const pickupCode = Math.random().toString(36).substring(2, 8).toUpperCase()

  // Crear pedido
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id,
      status: 'pending',
      total,
      pickup_code: pickupCode,
      user_name: user_name || 'Cliente',
    })
    .select()
    .single()

  if (orderError) return c.json({ error: orderError.message }, 500)

  // Crear items
  const orderItems = items.map(
    (item: { menu_item_id: string; quantity: number; price: number }) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      price: item.price,
    })
  )

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems)

  if (itemsError) return c.json({ error: itemsError.message }, 500)

  return c.json(order, 201)
})

// GET /orders/:userId - Obtener pedidos de un usuario
app.get('/server/orders/:userId', async (c) => {
  const supabase = getSupabaseClient(c.req.header('Authorization'))
  const userId = c.req.param('userId')

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// GET /orders - Obtener todos los pedidos activos (para camareros)
app.get('/server/orders', async (c) => {
  const supabase = getSupabaseClient(c.req.header('Authorization'))

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .in('status', ['pending', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// PATCH /orders/:orderId/status - Actualizar estado del pedido
app.patch('/server/orders/:orderId/status', async (c) => {
  const supabase = getSupabaseClient(c.req.header('Authorization'))
  const orderId = c.req.param('orderId')
  const { status } = await c.req.json()

  const validStatuses = ['pending', 'preparing', 'ready', 'completed']
  if (!validStatuses.includes(status)) {
    return c.json({ error: 'Estado inválido' }, 400)
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single()

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// GET /orders/:orderId/items - Obtener items de un pedido
app.get('/server/orders/:orderId/items', async (c) => {
  const supabase = getSupabaseClient(c.req.header('Authorization'))
  const orderId = c.req.param('orderId')

  const { data, error } = await supabase
    .from('order_items')
    .select('*, menu_item:menu_items(*)')
    .eq('order_id', orderId)

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// Health check
app.get('/server/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

Deno.serve(app.fetch)
