const SUPABASE_URL = 'https://xjeuqinimbiwmdyjraih.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZXVxaW5pbWJpd21keWpyYWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzM3NDIsImV4cCI6MjA5MjUwOTc0Mn0.nPDwvL9ZGwJgU45gMpaCNnZV7UYFtaeIvsueY2t0Fj0';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);  