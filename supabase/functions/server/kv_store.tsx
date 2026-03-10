// Utilidad para KV Store de Supabase
// Útil para almacenar datos en caché o configuraciones rápidas

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

export async function kvGet(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('kv_store')
    .select('value')
    .eq('key', key)
    .single()

  if (error || !data) return null
  return data.value
}

export async function kvSet(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('kv_store')
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) throw error
}

export async function kvDelete(key: string): Promise<void> {
  const { error } = await supabase
    .from('kv_store')
    .delete()
    .eq('key', key)

  if (error) throw error
}
