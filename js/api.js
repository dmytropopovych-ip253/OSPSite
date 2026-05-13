/* ============================================================
   API.JS — Запити до сервера / Supabase
   ============================================================ */

const SUPABASE_URL = 'https://xjeuqinimbiwmdyjraih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZXVxaW5pbWJpd21keWpyYWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzM3NDIsImV4cCI6MjA5MjUwOTc0Mn0.nPDwvL9ZGwJgU45gMpaCNnZV7UYFtaeIvsueY2t0Fj0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);  

/* ── Apartments ── */

async function apiFetchApartments() {
    const { data, error } = await supabaseClient.from('apartments').select('*');
    if (error) { console.error('apiFetchApartments:', error); return []; }
    return data || [];
}

async function apiFetchApartmentById(id) {
    const { data, error } = await supabaseClient
        .from('apartments')
        .select('*')
        .eq('id', id)
        .single();
    if (error) { console.error('apiFetchApartmentById:', error); return null; }
    return data;
}

async function apiInsertApartment(aptData) {
    const { error } = await supabaseClient.from('apartments').insert([aptData]);
    return error;
}

async function apiUpdateApartment(id, aptData) {
    const { error } = await supabaseClient.from('apartments').update(aptData).eq('id', id);
    return error;
}

async function apiDeleteApartment(id) {
    const { error } = await supabaseClient.from('apartments').delete().eq('id', id);
    return error;
}

async function apiUploadApartmentImage(file) {
    const ext      = file.name.split('.').pop();
    const fileName = `apt_${Date.now()}.${ext}`;
    const { error } = await supabaseClient
        .storage.from('apartment-images')
        .upload(fileName, file, { upsert: true, contentType: file.type });
    if (error) return { url: null, error };
    const { data } = supabaseClient.storage.from('apartment-images').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
}


/* ── Accounts ── */

async function apiFetchAccounts() {
    const { data, error } = await supabaseClient.from('accounts').select('*');
    if (error) { console.error('apiFetchAccounts:', error); return []; }
    return data || [];
}

async function apiFetchAccountByLogin(login) {
    const { data, error } = await supabaseClient
        .from('accounts')
        .select('*')
        .eq('login', login)
        .single();
    if (error) { console.error('apiFetchAccountByLogin:', error); return null; }
    return data;
}

async function apiUpdateAccount(login, fields) {
    const { error } = await supabaseClient.from('accounts').update(fields).eq('login', login);
    return error;
}

async function apiDeleteAccount(login) {
    const { error } = await supabaseClient.from('accounts').delete().eq('login', login);
    return error;
}

async function apiInsertAccount(accountData) {
    const { error } = await supabaseClient.from('accounts').insert([accountData]);
    return error;
}

async function apiUploadAvatar(login, file) {
    const ext      = file.name.split('.').pop();
    const fileName = `avatar_${login}_${Date.now()}.${ext}`;
    const { error } = await supabaseClient
        .storage.from('avatars')
        .upload(fileName, file, { upsert: true, contentType: file.type });
    if (error) return { url: null, error };
    const { data } = supabaseClient.storage.from('avatars').getPublicUrl(fileName);
    return { url: data.publicUrl, error: null };
}


/* ── Rental Messages ── */

async function apiFetchRentalMessages(userLogin) {
    const query = supabaseClient
        .from('rental_messages')
        .select('*')
        .order('date', { ascending: false });
    if (userLogin) query.eq('user_login', userLogin);
    const { data, error } = await query;
    if (error) { console.error('apiFetchRentalMessages:', error); return []; }
    return data || [];
}

async function apiInsertRentalMessage(msgData) {
    const { error } = await supabaseClient.from('rental_messages').insert([msgData]);
    return error;
}

async function apiDeleteRentalMessage(id) {
    const { error } = await supabaseClient.from('rental_messages').delete().eq('id', id);
    return error;
}


/* ── Contact Messages ── */

async function apiFetchContactMessages() {
    const { data, error } = await supabaseClient.from('contact_messages').select('*');
    if (error) { console.error('apiFetchContactMessages:', error); return []; }
    return data || [];
}

async function apiInsertContactMessage(msgData) {
    const { error } = await supabaseClient.from('contact_messages').insert([msgData]);
    return error;
}

async function apiDeleteContactMessage(id) {
    const { error } = await supabaseClient.from('contact_messages').delete().eq('id', id);
    return error;
}
