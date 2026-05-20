/* ============================================================
   js/supabase-client.js — Supabase клієнт для Vite-проєкту
   ============================================================
   Замінює пряме підключення CDN-скрипту supabase.js у HTML.
   Ключі читаються з .env.local через import.meta.env.VITE_*.
   ============================================================ */

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Supabase credentials missing. ' +
    'Create .env.local with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

export const supabaseClient = createClient(url, key);
export const SUPABASE_URL = 'https://xjeuqinimbiwmdyjraih.supabase.co';