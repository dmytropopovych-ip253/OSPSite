/* ============================================================
   js/services/accounts.js — Робота з профілями через Supabase Auth
   ============================================================ */

import { supabaseClient } from '../supabase-client.js';

export async function apiFetchAccounts() {
    const { data, error } = await supabaseClient.from('profiles').select('*');
    if (error) { console.error('apiFetchAccounts:', error); return []; }
    return data || [];
}

export async function apiFetchAccountByLogin(login) {
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('login', login)
        .single();
    if (error) { console.error('apiFetchAccountByLogin:', error); return null; }
    return data;
}

export async function apiUpdateAccount(login, fields) {
    const { error } = await supabaseClient
        .from('profiles')
        .update(fields)
        .eq('login', login);
    return error;
}

export async function apiDeleteAccount(login) {
    const { error } = await supabaseClient
        .from('profiles')
        .delete()
        .eq('login', login);
    return error;
}

export async function apiUploadAvatar(login, file) {
    const ext      = file.name.split('.').pop();
    const fileName = `avatar_${login}_${Date.now()}.${ext}`;
    const { error } = await supabaseClient
        .storage.from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type });
    if (error) return { url: null, error };
    const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
}
