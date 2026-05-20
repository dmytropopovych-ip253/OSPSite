/* ============================================================
   js/api/contact-messages.js — Запити до таблиці contact_messages
   ============================================================ */

import { supabaseClient } from '../supabase-client.js';

export async function apiFetchContactMessages() {
  const { data, error } = await supabaseClient.from('contact_messages').select('*');
  if (error) { console.error('apiFetchContactMessages:', error); return []; }
  return data || [];
}

export async function apiInsertContactMessage(msgData) {
  const { error } = await supabaseClient.from('contact_messages').insert([msgData]);
  return error;
}

export async function apiDeleteContactMessage(id) {
  const { error } = await supabaseClient.from('contact_messages').delete().eq('id', id);
  return error;
}
