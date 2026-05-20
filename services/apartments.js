/* ============================================================
   js/api/apartments.js — Запити до таблиці apartments
   ============================================================ */

import { supabaseClient } from '../supabase-client.js';

export async function apiFetchApartments() {
  const { data, error } = await supabaseClient.from('apartments').select('*');
  if (error) { console.error('apiFetchApartments:', error); return []; }
  return data || [];
}

export async function apiFetchApartmentById(id) {
  const { data, error } = await supabaseClient
    .from('apartments')
    .select('*')
    .eq('id', id)
    .single();
  if (error) { console.error('apiFetchApartmentById:', error); return null; }
  return data;
}

export async function apiInsertApartment(aptData) {
  const { error } = await supabaseClient.from('apartments').insert([aptData]);
  return error;
}

export async function apiUpdateApartment(id, aptData) {
  const { error } = await supabaseClient.from('apartments').update(aptData).eq('id', id);
  return error;
}

export async function apiDeleteApartment(id) {
  const { error } = await supabaseClient.from('apartments').delete().eq('id', id);
  return error;
}

export async function apiUploadApartmentImage(file) {
  const ext      = file.name.split('.').pop();
  const fileName = `apt_${Date.now()}.${ext}`;
  const { error } = await supabaseClient
    .storage.from('apartment-images')
    .upload(fileName, file, { upsert: true, contentType: file.type });
  if (error) return { url: null, error };
  const { data } = supabaseClient.storage.from('apartment-images').getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}
