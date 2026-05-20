/* ============================================================
   js/api/rental-messages.js — Запити до таблиці rental_messages
   ============================================================ */

import { supabaseClient } from '../supabase-client.js';

export async function apiFetchRentalMessages(userLogin) {
  let query = supabaseClient.from('rental_messages').select('*');
  if (userLogin) query = query.eq('user_login', userLogin);
  const { data, error } = await query;
  if (error) { console.error('apiFetchRentalMessages:', error); return []; }
  return data || [];
}

export async function apiInsertRentalMessage(msgData) {
  const { error } = await supabaseClient.from('rental_messages').insert([msgData]);
  return error;
}

export async function apiDeleteRentalMessage(id) {
  const { error } = await supabaseClient.from('rental_messages').delete().eq('id', id);
  return error;
}
