# 🍺 BarApp

Sistema de gestión de pedidos para bares y restaurantes. Los **clientes** consultan la carta y realizan pedidos desde su móvil, mientras que los **camareros** gestionan y entregan los pedidos en tiempo real.

## Funcionalidades

### Cliente
- Consulta la carta digital con búsqueda y filtro por categoría
- Carrito de compra con control de cantidades
- Realización de pedidos con código de recogida
- Historial de pedidos con seguimiento de estado en tiempo real
- Código QR generado automáticamente para pedidos listos

### Camarero
- Panel de pedidos con filtros por estado (Pendientes / Preparando / Listos / Entregados)
- Actualización del estado de cada pedido paso a paso
- Verificación de entrega mediante escaneo QR o introducción manual del código
- Vista detallada de cada pedido con barra de progreso

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript |
| Estilos | Tailwind CSS |
| Routing | React Router v6 |
| Backend | Supabase (Auth, PostgreSQL, Edge Functions) |
| QR | html5-qrcode / qrcode |
| Iconos | Lucide React |
| Build | Vite |

## Requisitos previos

- **Node.js** ≥ 18
- Una cuenta en [Supabase](https://supabase.com) con un proyecto creado

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/BarApp.git
cd BarApp

# Instalar dependencias
npm install
```

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

2. Ejecuta la migración de la base de datos en el **SQL Editor** de Supabase:
   - Copia el contenido de `supabase/migrations/001_initial_schema.sql` y ejecútalo.
   - Esto crea las tablas (`menu_items`, `orders`, `order_items`), índices, políticas RLS y datos de ejemplo en la carta.

3. En Supabase → Authentication → Settings, desactiva **"Confirm email"** si quieres poder registrarte y entrar directamente sin verificar el correo.

## Ejecución

```bash
# Desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

La app estará disponible en `http://localhost:5173`.

## Uso

1. **Regístrate** como `cliente` o `camarero` desde la pantalla de registro.
2. **Cliente**: navega por la carta, añade productos al carrito y realiza un pedido.
3. **Camarero**: gestiona los pedidos desde el panel, avanza el estado y entrega verificando el código QR.
4. Para usar ambos roles a la vez, abre una ventana de incógnito con la otra cuenta.

## Estructura del proyecto

```
BarApp/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Router principal y gestión de auth
│   │   ├── types.ts             # Interfaces TypeScript
│   │   ├── utils/
│   │   │   └── supabase.ts      # Cliente Supabase
│   │   └── components/
│   │       ├── Login.tsx         # Inicio de sesión
│   │       ├── Register.tsx      # Registro con selección de rol
│   │       ├── ClientView.tsx    # Shell del cliente (carta/carrito/pedidos)
│   │       ├── Menu.tsx          # Carta digital
│   │       ├── Cart.tsx          # Carrito de compra
│   │       ├── OrderHistory.tsx  # Historial de pedidos del cliente
│   │       ├── WaiterView.tsx    # Panel del camarero
│   │       ├── OrderDetails.tsx  # Detalle y gestión de un pedido
│   │       └── QRScanner.tsx     # Escáner QR / entrada manual de código
│   ├── styles/
│   │   ├── theme.css            # Tailwind + variables CSS
│   │   └── fonts.css            # Fuentes (Inter)
│   └── main.tsx                 # Punto de entrada React
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Esquema de BD completo
│   └── functions/
│       └── server/              # Edge Functions (Hono/Deno)
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Estados de un pedido

| Estado | Descripción | Color |
|--------|------------|-------|
| 🟠 Pendiente | Pedido recibido, esperando preparación | Naranja |
| 🟣 Preparando | El pedido se está preparando | Violeta |
| 🟢 Listo | Listo para recoger (se genera QR) | Verde |
| ⚫ Entregado | Verificado y entregado al cliente | Gris |
