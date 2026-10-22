import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Client Supabase, ou null si les variables d'environnement ne sont pas définies (mode démo). */
export const supabase = url && key ? createClient(url, key) : null
