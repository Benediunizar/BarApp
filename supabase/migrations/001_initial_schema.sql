-- =============================================
-- BarApp - Migración de Base de Datos (Supabase/PostgreSQL)
-- =============================================

-- Tabla: menu_items (Carta del bar)
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: orders (Pedidos)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT DEFAULT 'Cliente',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  total NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  pickup_code TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla: order_items (Items de cada pedido)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0)
);

-- Tabla: kv_store (Key-Value para configuración)
CREATE TABLE IF NOT EXISTS kv_store (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(available);

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- menu_items: todos pueden leer
CREATE POLICY "Menu items públicos"
  ON menu_items FOR SELECT
  USING (true);

-- orders: los clientes solo ven sus pedidos, camareros ven todos
CREATE POLICY "Clientes ven sus pedidos"
  ON orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'waiter'
  );

-- orders: clientes pueden crear sus propios pedidos
CREATE POLICY "Clientes crean pedidos"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- orders: camareros pueden actualizar cualquier pedido
CREATE POLICY "Camareros actualizan pedidos"
  ON orders FOR UPDATE
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'waiter');

-- order_items: visible si el usuario puede ver el pedido
CREATE POLICY "Ver items de pedidos propios o como camarero"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (
        orders.user_id = auth.uid()
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'waiter'
      )
    )
  );

-- order_items: clientes pueden insertar items en sus pedidos
CREATE POLICY "Clientes insertan items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- =============================================
-- Datos de ejemplo para la carta
-- =============================================

INSERT INTO menu_items (name, description, price, image_url, category, available) VALUES
  -- Cervezas
  ('Caña', 'Cerveza de barril servida en vaso de caña (200ml)', 1.80, 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=400', 'Cervezas', true),
  ('Jarra', 'Jarra de cerveza de barril (500ml)', 3.50, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400', 'Cervezas', true),
  ('Cerveza sin alcohol', 'Cerveza 0,0% en botellín', 2.00, 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400', 'Cervezas', true),

  -- Refrescos
  ('Coca-Cola', 'Coca-Cola original (330ml)', 2.50, 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400', 'Refrescos', true),
  ('Agua mineral', 'Botella de agua mineral (500ml)', 1.50, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400', 'Refrescos', true),
  ('Zumo de naranja', 'Zumo de naranja natural recién exprimido', 3.00, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400', 'Refrescos', true),

  -- Tapas
  ('Patatas bravas', 'Patatas fritas con salsa brava y alioli caseros', 4.50, 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400', 'Tapas', true),
  ('Croquetas de jamón', 'Croquetas caseras de jamón ibérico (6 uds)', 6.00, 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?w=400', 'Tapas', true),
  ('Tortilla española', 'Pincho de tortilla de patatas con cebolla', 3.50, 'https://images.unsplash.com/photo-1594301726051-eebccf5c2517?w=400', 'Tapas', true),
  ('Jamón ibérico', 'Plato de jamón ibérico de bellota cortado a mano', 12.00, 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', 'Tapas', true),

  -- Bocadillos
  ('Bocadillo de calamares', 'Bocadillo de calamares fritos con limón', 5.50, 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=400', 'Bocadillos', true),
  ('Bocadillo de lomo', 'Bocadillo de lomo con pimientos del padrón', 5.00, 'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400', 'Bocadillos', true),

  -- Cafés
  ('Café solo', 'Café espresso', 1.30, 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400', 'Cafés', true),
  ('Café con leche', 'Café con leche cremoso', 1.60, 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400', 'Cafés', true),
  ('Cortado', 'Café cortado con un toque de leche', 1.40, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=400', 'Cafés', true);

-- =============================================
-- Tabla: profiles (Perfiles de usuario)
-- =============================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'waiter')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles visibles para usuarios autenticados"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Usuarios actualizan su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Función que copia los datos automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: se ejecuta cada vez que se registra alguien
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
