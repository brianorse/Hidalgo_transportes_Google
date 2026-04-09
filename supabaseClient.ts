
import { createClient } from '@supabase/supabase-js';

// --- TUS CREDENCIALES ---

// 1. URL DE TU PROYECTO
const SUPABASE_URL: string = (import.meta.env.VITE_SUPABASE_URL as string) || '';

// 2. CLAVE "ANON PUBLIC" CONFIGURADA
const SUPABASE_ANON_KEY: string = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (import.meta.env.VITE_SUPABASE_ANON as string) || '';

// ------------------------------------------------

// Detecta si la clave está configurada
export const isSupabaseConfigured = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

// Usamos valores temporales si no está configurado para evitar que la librería lance un error fatal al iniciar
const finalUrl = isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder-project.supabase.co';
const finalKey = isSupabaseConfigured ? SUPABASE_ANON_KEY : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);

export const getApiUrl = () => `${SUPABASE_URL}/rest/v1`;
export const getApiKey = () => SUPABASE_ANON_KEY;
