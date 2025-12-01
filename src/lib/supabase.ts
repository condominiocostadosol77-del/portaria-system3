import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
// Cole suas chaves do Supabase abaixo, dentro das aspas.

const SUPABASE_URL: string = 'https://gzqqadluzmuqbodxpndm.supabase.co';
const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6cXFhZGx1em11cWJvZHhwbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NTM5MTcsImV4cCI6MjA4MDEyOTkxN30.orJFMwroTzORCqy7U6ahFDemvLtNWrwxyxf5mTycjX8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
