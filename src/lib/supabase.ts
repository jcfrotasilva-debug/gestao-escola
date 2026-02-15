import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qoeitvltwnprufydusqh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvZWl0dmx0d25wcnVmeWR1c3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjI0ODAsImV4cCI6MjA4NjIzODQ4MH0.CH2mwFBo6waMd4KPBP6ZqsZ3DMviCDUSJ-VvVSqo66o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
