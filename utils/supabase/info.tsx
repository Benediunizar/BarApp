// Información de configuración de Supabase
// Reemplaza con tus credenciales reales de Supabase

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  edgeFunctionUrl: import.meta.env.VITE_SUPABASE_EDGE_FUNCTION_URL || '',
}
