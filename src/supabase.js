import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !chave) {
  console.error(
    'Faltam VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY. ' +
    'Crie o arquivo .env na raiz do projeto (veja .env.example).'
  )
}

export const supabase = createClient(url ?? '', chave ?? '')
